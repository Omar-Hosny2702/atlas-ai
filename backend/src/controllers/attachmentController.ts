import crypto from 'node:crypto';

import type {
  NextFunction,
  Request,
  Response,
} from 'express';

import {
  handleUpload,
  type HandleUploadBody,
} from '@vercel/blob/client';

import { config } from '../config/config.js';
import { getDatabase } from '../db/database.js';
import { AppError } from '../types/index.js';

const MAX_FILE_SIZE =
  20 * 1024 * 1024;

const TICKET_LIFETIME_MS =
  5 * 60 * 1000;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

interface UploadTicket {
  attachmentId: string;
  userId: string;
  conversationId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: 'image' | 'file';
  expiresAt: number;
}

function encode(
  value: string
): string {
  return Buffer.from(
    value
  ).toString('base64url');
}

function decode(
  value: string
): string {
  return Buffer.from(
    value,
    'base64url'
  ).toString('utf8');
}

function signTicket(
  payload: UploadTicket
): string {
  if (
    !config.attachmentUploadSecret
  ) {
    throw new AppError(
      'Attachment uploads are not configured.',
      500
    );
  }

  const encoded = encode(
    JSON.stringify(payload)
  );

  const signature = crypto
    .createHmac(
      'sha256',
      config.attachmentUploadSecret
    )
    .update(encoded)
    .digest('base64url');

  return `${encoded}.${signature}`;
}

function verifyTicket(
  ticket: string
): UploadTicket {
  if (
    !config.attachmentUploadSecret
  ) {
    throw new AppError(
      'Attachment uploads are not configured.',
      500
    );
  }

  const [
    encoded,
    signature,
  ] = ticket.split('.');

  if (
    !encoded ||
    !signature
  ) {
    throw new AppError(
      'Invalid upload ticket.',
      401
    );
  }

  const expected = crypto
    .createHmac(
      'sha256',
      config.attachmentUploadSecret
    )
    .update(encoded)
    .digest();

  let supplied: Buffer;

  try {
    supplied = Buffer.from(
      signature,
      'base64url'
    );
  } catch {
    throw new AppError(
      'Invalid upload ticket.',
      401
    );
  }

  if (
    supplied.length !==
      expected.length ||
    !crypto.timingSafeEqual(
      supplied,
      expected
    )
  ) {
    throw new AppError(
      'Invalid upload ticket.',
      401
    );
  }

  let payload:
    UploadTicket;

  try {
    payload = JSON.parse(
      decode(encoded)
    ) as UploadTicket;
  } catch {
    throw new AppError(
      'Invalid upload ticket.',
      401
    );
  }

  if (
    !payload.attachmentId ||
    !payload.userId ||
    !payload.conversationId ||
    !payload.fileName ||
    !payload.mimeType ||
    !payload.kind ||
    !payload.expiresAt
  ) {
    throw new AppError(
      'Invalid upload ticket.',
      401
    );
  }

  if (
    payload.expiresAt <=
    Date.now()
  ) {
    throw new AppError(
      'Upload ticket has expired.',
      401
    );
  }

  return payload;
}

async function ensureConversationOwnership(
  userId: string,
  conversationId: string
): Promise<void> {
  const sql =
    await getDatabase();

  const rows =
    await sql<
      { id: string }[]
    >`
      SELECT id
      FROM conversations
      WHERE id = ${conversationId}
        AND user_id = ${userId}
      LIMIT 1
    `;

  if (!rows[0]) {
    throw new AppError(
      'Conversation not found.',
      404
    );
  }
}

function validateFile(
  fileName: unknown,
  mimeType: unknown,
  sizeBytes: unknown,
  kind: unknown
): asserts kind is
  | 'image'
  | 'file' {
  if (
    typeof fileName !==
      'string' ||
    !fileName.trim() ||
    typeof mimeType !==
      'string' ||
    !mimeType.trim() ||
    typeof sizeBytes !==
      'number' ||
    !Number.isFinite(
      sizeBytes
    )
  ) {
    throw new AppError(
      'Invalid attachment.',
      400
    );
  }

  if (
    kind !== 'image' &&
    kind !== 'file'
  ) {
    throw new AppError(
      'Invalid attachment type.',
      400
    );
  }

  if (
    sizeBytes <= 0 ||
    sizeBytes >
      MAX_FILE_SIZE
  ) {
    throw new AppError(
      'Files must be 20 MB or smaller.',
      400
    );
  }

  if (
    kind === 'image' &&
    !ALLOWED_IMAGE_TYPES.includes(
      mimeType
    )
  ) {
    throw new AppError(
      'Unsupported image format.',
      400
    );
  }
}

export async function handleCreateUploadTicket(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId =
      req.auth!.userId;

    const {
      conversationId,
      fileName,
      mimeType,
      sizeBytes,
      kind,
    } = req.body as {
      conversationId?: string;
      fileName?: string;
      mimeType?: string;
      sizeBytes?: number;
      kind?: string;
    };

    if (
      typeof conversationId !==
        'string' ||
      !conversationId.trim()
    ) {
      throw new AppError(
        'Conversation is required.',
        400
      );
    }

    validateFile(
      fileName,
      mimeType,
      sizeBytes,
      kind
    );

    await ensureConversationOwnership(
      userId,
      conversationId
    );

    const attachmentId =
      crypto.randomUUID();

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
        status
      )
      VALUES (
        ${attachmentId},
        ${userId},
        ${conversationId},
        ${fileName as string},
        ${mimeType as string},
        ${sizeBytes as number},
        ${kind},
        'vercel-blob',
        'pending'
      )
    `;

    const ticket =
      signTicket({
        attachmentId,
        userId,
        conversationId,
        fileName:
          fileName as string,
        mimeType:
          mimeType as string,
        sizeBytes:
          sizeBytes as number,
        kind,
        expiresAt:
          Date.now() +
          TICKET_LIFETIME_MS,
      });

    res.json({
      attachmentId,
      ticket,
      expiresIn: 300,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleAttachmentUpload(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result =
      await handleUpload({
        body:
          req.body as HandleUploadBody,

        request: req,

        onBeforeGenerateToken:
          async (
            _pathname,
            clientPayload
          ) => {
            if (
              !clientPayload
            ) {
              throw new AppError(
                'Upload ticket is required.',
                401
              );
            }

            const payload =
              verifyTicket(
                clientPayload
              );

            await ensureConversationOwnership(
              payload.userId,
              payload.conversationId
            );

            const sql =
              await getDatabase();

            const rows =
              await sql<
                {
                  id: string;
                  status: string;
                }[]
              >`
                SELECT
                  id,
                  status
                FROM attachments
                WHERE id =
                    ${payload.attachmentId}
                  AND user_id =
                    ${payload.userId}
                  AND conversation_id =
                    ${payload.conversationId}
                LIMIT 1
              `;

            if (!rows[0]) {
              throw new AppError(
                'Attachment not found.',
                404
              );
            }

            return {
              allowedContentTypes:
                payload.kind ===
                'image'
                  ? ALLOWED_IMAGE_TYPES
                  : undefined,

              maximumSizeInBytes:
                MAX_FILE_SIZE,

              addRandomSuffix:
                true,

              tokenPayload:
                JSON.stringify(
                  payload
                ),
            };
          },

        onUploadCompleted:
          async ({
            blob,
            tokenPayload,
          }) => {
            if (
              !tokenPayload
            ) {
              throw new Error(
                'Missing attachment metadata.'
              );
            }

            const payload =
              JSON.parse(
                tokenPayload
              ) as UploadTicket;

            const sql =
              await getDatabase();

            const rows =
              await sql<
                { id: string }[]
              >`
                UPDATE attachments
                SET
                  storage_key =
                    ${blob.pathname},
                  storage_url =
                    ${blob.url},
                  status =
                    'uploaded'
                WHERE id =
                    ${payload.attachmentId}
                  AND user_id =
                    ${payload.userId}
                  AND conversation_id =
                    ${payload.conversationId}
                RETURNING id
              `;

            if (!rows[0]) {
              throw new Error(
                'Attachment record not found.'
              );
            }
          },
      });

    res.json(result);
  } catch (error) {
    next(error);
  }
}
export async function handleCompleteAttachmentUpload(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId =
      req.auth!.userId;

    const {
      attachmentId,
      pathname,
      url,
    } = req.body as {
      attachmentId?: string;
      pathname?: string;
      url?: string;
    };

    if (
      !attachmentId ||
      !pathname ||
      !url
    ) {
      throw new AppError(
        'Missing attachment upload information.',
        400
      );
    }

    const sql =
      await getDatabase();

    const rows =
      await sql<
        { id: string }[]
      >`
        UPDATE attachments
        SET
          storage_key = ${pathname},
          storage_url = ${url},
          status = 'uploaded'
        WHERE id = ${attachmentId}
          AND user_id = ${userId}
        RETURNING id
      `;

    if (!rows[0]) {
      throw new AppError(
        'Attachment not found.',
        404
      );
    }

    res.status(200).json({
      completed: true,
    });
  } catch (error) {
    next(error);
  }
}