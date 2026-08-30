import type {
  Request,
  Response,
} from 'express';

import {
  z,
} from 'zod';

import {
  saveUsefulMemories,
} from '../services/memoryExtractionService.js';

import {
  addMessage,
  buildPromptHistory,
  deleteMessagesFrom,
  getConversation,
  getMessages,
  maybeAutoTitle,
  updateConversation,
} from '../services/conversationService.js';

import {
  streamChatCompletion,
  extractMemoriesFromMessage,
} from '../services/llmService.js';

import {
  AppError,
  type MessageMetadata,
} from '../types/index.js';

import {
  logger,
} from '../utils/logger.js';

import {
  getMemories,
} from '../services/memoryService.js';

import {
  getPreferences,
} from '../services/preferenceService.js';

import {
  getDatabase,
} from '../db/database.js';

export const sendMessageSchema =
  z.object({
    content:
      z.string()
        .min(
          1,
          'Message cannot be empty.'
        )
        .max(
          32000,
          'Message is too long.'
        ),

    attachmentIds:
      z.array(
        z.string().uuid()
      )
        .max(10)
        .optional(),

    temperature:
      z.number()
        .min(0)
        .max(2)
        .optional(),

    maxTokens:
      z.number()
        .int()
        .min(1)
        .max(8192)
        .optional(),

    topP:
      z.number()
        .min(0)
        .max(1)
        .optional(),

    model:
      z.string()
        .optional(),
  });

const activeGenerations =
  new Map<
    string,
    AbortController
  >();

function sseWrite(
  res: Response,
  payload:
    Record<
      string,
      unknown
    >
): void {
  res.write(
    `data: ${JSON.stringify(
      payload
    )}\n\n`
  );
}

function startSse(
  res: Response
): void {
  res.writeHead(
    200,
    {
      'Content-Type':
        'text/event-stream',

      'Cache-Control':
        'no-cache, no-transform',

      Connection:
        'keep-alive',

      'X-Accel-Buffering':
        'no',
    }
  );
}

async function buildAttachmentMetadata(
  userId: string,
  conversationId: string,
  attachmentIds: string[]
): Promise<MessageMetadata> {
  if (
    attachmentIds.length === 0
  ) {
    return {};
  }

  const sql =
    await getDatabase();

  const rows =
    await sql<
      {
        id: string;
        file_name: string;
        mime_type: string;
        size_bytes: number;
        kind:
          | 'image'
          | 'file';
        storage_url:
          | string
          | null;
        status: string;
      }[]
    >`
      SELECT
        id,
        file_name,
        mime_type,
        size_bytes,
        kind,
        storage_url,
        status
      FROM attachments
      WHERE user_id =
          ${userId}
        AND conversation_id =
          ${conversationId}
        AND id IN ${sql(
          attachmentIds
        )}
    `;

  if (
    rows.length !==
    attachmentIds.length
  ) {
    throw new AppError(
      'One or more attachments could not be found.',
      400
    );
  }

  let currentRows =
    rows;

  for (
    let attempt = 0;
    attempt < 12;
    attempt++
  ) {
    const stillProcessing =
      currentRows.some(
        (row) =>
          row.status !==
          'uploaded'
      );

    if (
      !stillProcessing
    ) {
      break;
    }

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          250
        )
    );

    currentRows =
      await sql<
        {
          id: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          kind:
            | 'image'
            | 'file';
          storage_url:
            | string
            | null;
          status: string;
        }[]
      >`
        SELECT
          id,
          file_name,
          mime_type,
          size_bytes,
          kind,
          storage_url,
          status
        FROM attachments
        WHERE user_id =
            ${userId}
          AND conversation_id =
            ${conversationId}
          AND id IN ${sql(
            attachmentIds
          )}
      `;
  }

  const invalid =
    currentRows.find(
      (row) =>
        row.status !==
        'uploaded'
    );

  if (invalid) {
    throw new AppError(
      'The attachment upload has not finished yet. Please try again.',
      409
    );
  }

  const byId =
    new Map(
      currentRows.map(
        (row) => [
          row.id,
          row,
        ]
      )
    );

  return {
    attachments:
      attachmentIds.map(
        (
          attachmentId
        ) => {
          const row =
            byId.get(
              attachmentId
            )!;

          return {
            id:
              row.id,

            fileName:
              row.file_name,

            mimeType:
              row.mime_type,

            sizeBytes:
              Number(
                row.size_bytes
              ),

            kind:
              row.kind,

            storageUrl:
              row.storage_url,
          };
        }
      ),
  };
}

async function linkAttachmentsToMessage(
  userId: string,
  conversationId: string,
  attachmentIds: string[],
  messageId: string
): Promise<void> {
  if (
    attachmentIds.length === 0
  ) {
    return;
  }

  const sql =
    await getDatabase();

  await sql`
    UPDATE attachments
    SET
      message_id =
        ${messageId}
    WHERE user_id =
        ${userId}
      AND conversation_id =
        ${conversationId}
      AND id IN ${sql(
        attachmentIds
      )}
  `;
}

async function runGeneration(
  userId: string,
  conversationId: string,
  res: Response,
  regenerating: boolean
): Promise<void> {
  const conversation =
    await getConversation(
      userId,
      conversationId
    );

  const controller =
    new AbortController();

  activeGenerations.set(
    conversationId,
    controller
  );

  startSse(res);

  res.req.on(
    'close',
    () => {
      if (
        !res.writableEnded
      ) {
        controller.abort();
      }
    }
  );

  try {
    const history =
      buildPromptHistory(
        conversation,
        await getMessages(
          userId,
          conversationId
        )
      );

    const preferences =
      await getPreferences(
        userId
      );

    const memories =
      await getMemories(
        userId
      );

    const userContext = `
USER PERSONALISATION:
- Tone: ${preferences.tone}
- Response length: ${preferences.verbosity}
- Personality: ${preferences.personality}
- Language style: ${preferences.languageStyle}
- Use emojis: ${preferences.useEmojis ? 'yes' : 'no'}
- Custom instructions: ${preferences.customInstructions || 'none'}

USER MEMORIES:
${
  memories.length
    ? memories
        .map(
          (memory) =>
            `- ${memory.content}`
        )
        .join('\n')
    : '- No saved memories yet.'
}

Follow the user's personalisation naturally. Use memories only when relevant.
`;

    history.unshift({
      role:
        'system',

      content:
        userContext,
    });

    let assistantText =
      '';

    const {
      fullText,
      stopped,
    } =
      await streamChatCompletion(
        history,

        {
          model:
            conversation.model,

          temperature:
            conversation.temperature,

          maxTokens:
            conversation.maxTokens,

          topP:
            conversation.topP,
        },

        (token) => {
          assistantText +=
            token;

          sseWrite(
            res,
            {
              type:
                'token',

              token,
            }
          );
        },

        controller.signal
      );

    const saved =
      await addMessage(
        userId,
        conversationId,
        'assistant',
        fullText ||
          assistantText,
        {
          stopped,
        }
      );

    if (
      !regenerating
    ) {
      const firstUser =
        (
          await getMessages(
            userId,
            conversationId
          )
        ).find(
          (message) =>
            message.role ===
            'user'
        );

      if (firstUser) {
        await maybeAutoTitle(
          userId,
          conversationId,
          firstUser.content
        );
      }
    }

    sseWrite(
      res,
      {
        type:
          'done',

        message:
          saved,
      }
    );
  } catch (err) {
    const message =
      err instanceof
      AppError
        ? err.message
        : 'The assistant ran into an unexpected error.';

    logger.error(
      'Generation failed',
      err
    );

    const saved =
      await addMessage(
        userId,
        conversationId,
        'assistant',
        '',
        {
          error:
            message,
        }
      );

    sseWrite(
      res,
      {
        type:
          'error',

        message,

        savedMessage:
          saved,
      }
    );
  } finally {
    activeGenerations
      .delete(
        conversationId
      );

    res.end();
  }
}

export async function sendMessage(
  req: Request,
  res: Response
): Promise<void> {
  const userId =
    req.auth!.userId;

  const {
    conversationId,
  } = req.params;

  const {
    content,
    attachmentIds = [],
    temperature,
    maxTokens,
    topP,
    model,
  } =
    req.body as z.infer<
      typeof sendMessageSchema
    >;

  const conversation =
    await getConversation(
      userId,
      conversationId
    );

  if (
    temperature !==
      undefined ||
    maxTokens !==
      undefined ||
    topP !==
      undefined ||
    (
      model !==
        undefined &&
      model !==
        conversation.model
    )
  ) {
    await updateConversation(
      userId,
      conversationId,
      {
        temperature,
        maxTokens,
        topP,
        model,
      }
    );
  }

  const metadata =
    await buildAttachmentMetadata(
      userId,
      conversationId,
      attachmentIds
    );

  const userMessage =
    await addMessage(
      userId,
      conversationId,
      'user',
      content,
      {
        metadata,
      }
    );

  await linkAttachmentsToMessage(
    userId,
    conversationId,
    attachmentIds,
    userMessage.id
  );

  const memoryWorthChecking =
    /\b(remember|my favourite|my favorite|i prefer|i like|i love|i hate|i use|i am|i'm|my project|from now on)\b/i
      .test(content);

  if (
    memoryWorthChecking
  ) {
    const extractedMemories =
      await extractMemoriesFromMessage(
        content
      );

    await saveUsefulMemories(
      userId,
      extractedMemories
    );
  }

  await runGeneration(
    userId,
    conversationId,
    res,
    false
  );
}

export async function regenerateMessage(
  req: Request,
  res: Response
): Promise<void> {
  const userId =
    req.auth!.userId;

  const {
    conversationId,
  } = req.params;

  const messages =
    await getMessages(
      userId,
      conversationId
    );

  const lastAssistantIndex =
    [
      ...messages,
    ]
      .reverse()
      .findIndex(
        (message) =>
          message.role ===
          'assistant'
      );

  if (
    lastAssistantIndex !==
    -1
  ) {
    const target =
      messages[
        messages.length -
          1 -
          lastAssistantIndex
      ];

    await deleteMessagesFrom(
      userId,
      conversationId,
      target.createdAt
    );
  }

  await runGeneration(
    userId,
    conversationId,
    res,
    true
  );
}

export async function stopGeneration(
  req: Request,
  res: Response
): Promise<void> {
  const userId =
    req.auth!.userId;

  const {
    conversationId,
  } = req.params;

  try {
    await getConversation(
      userId,
      conversationId
    );
  } catch (error) {
    if (
      error instanceof
      AppError
    ) {
      res.status(
        error.statusCode
      ).json({
        error:
          error.message,
      });

      return;
    }

    throw error;
  }

  const controller =
    activeGenerations.get(
      conversationId
    );

  if (!controller) {
    res.status(
      404
    ).json({
      error:
        'No generation is currently running for this conversation.',
    });

    return;
  }

  controller.abort();

  res.status(
    200
  ).json({
    stopped:
      true,
  });
}