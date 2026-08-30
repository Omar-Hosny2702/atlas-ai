import crypto from 'node:crypto';

import type {
  Request,
  Response,
} from 'express';

import {
  z,
} from 'zod';

import { get, put } from '@vercel/blob';

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
  classifyImageIntent,
} from '../services/llmService.js';

import {
  generateImage,
  editImage,
  type GeneratedImage,
} from '../services/imageGenerationService.js';

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
  })
    .superRefine(
      (
        value,
        ctx
      ) => {
        const hasText =
          value.content
            .trim()
            .length > 0;

        const hasAttachments =
          (
            value.attachmentIds
              ?.length ?? 0
          ) > 0;

        if (
          !hasText &&
          !hasAttachments
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode.custom,
            path:
              ['content'],
            message:
              'Message cannot be empty.',
          });
        }
      }
    );

interface RecentGeneratedImage {
  attachmentId: string;
  alt?: string;
}

function findLatestGeneratedImage(
  messages: Awaited<
    ReturnType<typeof getMessages>
  >
): RecentGeneratedImage | null {
  for (
    let i =
      messages.length - 1;
    i >= 0;
    i--
  ) {
    const generated =
      messages[i]
        .metadata
        ?.generatedImage;

    if (
      generated
        ?.attachmentId
    ) {
      return {
        attachmentId:
          generated.attachmentId,

        alt:
          generated.alt,
      };
    }
  }

  return null;
}

async function loadGeneratedImageBytes(
  userId: string,
  conversationId: string,
  attachmentId: string
): Promise<Buffer> {
  const sql =
    await getDatabase();

  const rows =
    await sql<
      {
        storage_key:
          string | null;
        status:
          string;
      }[]
    >`
      SELECT
        storage_key,
        status
      FROM attachments
      WHERE id =
          ${attachmentId}
        AND user_id =
          ${userId}
        AND conversation_id =
          ${conversationId}
      LIMIT 1
    `;

  const attachment =
    rows[0];

  if (
    !attachment ||
    attachment.status !==
      'uploaded' ||
    !attachment.storage_key
  ) {
    throw new AppError(
      'The image Atlas was trying to edit is no longer available.',
      404
    );
  }

  const result =
    await get(
      attachment.storage_key,
      {
        access:
          'private',
      }
    );

  if (
    !result ||
    result.statusCode !==
      200
  ) {
    throw new AppError(
      'Atlas could not load the previous image.',
      502
    );
  }

  const chunks:
    Buffer[] = [];

  for await (
    const chunk
    of result.stream
  ) {
    chunks.push(
      Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk)
    );
  }

  return Buffer.concat(
    chunks
  );
}

async function saveGeneratedImage(
  userId: string,
  conversationId: string,
  prompt: string,
  image: GeneratedImage
) {
  const attachmentId =
    crypto.randomUUID();

  const fileName =
    `atlas-generated-${attachmentId}.jpg`;

  const pathname =
    `atlas-generated/${conversationId}/${fileName}`;

  const bytes =
    Buffer.from(
      image.data,
      'base64'
    );

  const blob =
    await put(
      pathname,
      bytes,
      {
        access:
          'private',

        contentType:
          image.mimeType,

        addRandomSuffix:
          false,
      }
    );

  const sql =
    await getDatabase();

  await sql`
    INSERT INTO attachments (
      id,
      user_id,
      conversation_id,
      file_name,
      mime_type,
      size_bytes,
      kind,
      storage_provider,
      storage_key,
      storage_url,
      status
    )
    VALUES (
      ${attachmentId},
      ${userId},
      ${conversationId},
      ${fileName},
      ${image.mimeType},
      ${bytes.length},
      'image',
      'vercel-blob',
      ${blob.pathname},
      ${blob.url},
      'uploaded'
    )
  `;

  const saved =
    await addMessage(
      userId,
      conversationId,
      'assistant',
      '',
      {
        metadata: {
          generatedImage: {
            attachmentId,
            storageUrl:
              blob.url,
            mimeType:
              image.mimeType,
            alt:
              prompt,
          },
        },
      }
    );

  return {
    saved,
    attachmentId,
  };
}

async function sendImageResult(
  res: Response,
  saved: Awaited<
    ReturnType<typeof addMessage>
  >,
  image: GeneratedImage,
  prompt: string
): Promise<void> {
  sseWrite(
    res,
    {
      type:
        'done',

      message: {
        ...saved,

        /*
         * Transient copy used for immediate
         * display. The durable version is in
         * metadata.generatedImage + Blob.
         */
        image: {
          mimeType:
            image.mimeType,

          data:
            image.data,

          alt:
            prompt,
        },
      },
    }
  );
}

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

  /*
   * Natural image routing.
   *
   * Users do not need to type /atlas image.
   * Gemini decides whether the message is:
   *
   * chat     -> normal Atlas response
   * generate -> new image
   * edit     -> modify latest generated image
   */
  const conversationMessages =
    await getMessages(
      userId,
      conversationId
    );

  const latestGeneratedImage =
    findLatestGeneratedImage(
      conversationMessages
    );

  const imageIntent =
    content.trim()
      ? await classifyImageIntent(
          content,
          Boolean(
            latestGeneratedImage
          )
        )
      : 'chat';

  if (
    imageIntent ===
      'generate' ||
    (
      imageIntent ===
        'edit' &&
      latestGeneratedImage
    )
  ) {
    startSse(
      res
    );

    try {
      let image:
        GeneratedImage;

      if (
        imageIntent ===
          'edit' &&
        latestGeneratedImage
      ) {
        const sourceBytes =
          await loadGeneratedImageBytes(
            userId,
            conversationId,
            latestGeneratedImage
              .attachmentId
          );

        image =
          await editImage(
            content,
            sourceBytes
          );
      } else {
        image =
          await generateImage(
            content
          );
      }

      const {
        saved,
      } =
        await saveGeneratedImage(
          userId,
          conversationId,
          content,
          image
        );

      const firstUser =
        conversationMessages.find(
          (
            message
          ) =>
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

      await sendImageResult(
        res,
        saved,
        image,
        content
      );
    } catch (error) {
      const message =
        error instanceof
          AppError
          ? error.message
          : 'Atlas could not create that image.';

      logger.error(
        'Image action failed',
        error
      );

      const savedMessage =
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

          savedMessage,
        }
      );
    } finally {
      res.end();
    }

    return;
  }

  const memoryWorthChecking =
    content.trim().length >
      0 &&
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

  if (
    !controller
  ) {
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