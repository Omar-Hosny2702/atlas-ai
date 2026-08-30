import {
  upload,
} from '@vercel/blob/client';

import {
  apiFetch,
  BASE_URL,
} from './client';

export type AttachmentKind =
  | 'image'
  | 'file';

interface UploadTicketResponse {
  attachmentId: string;
  ticket: string;
  expiresIn: number;
}

export interface UploadedAttachment {
  attachmentId: string;
  url: string;
  pathname: string;
  contentType: string;
  contentDisposition: string;
}

interface UploadAttachmentOptions {
  file: File;
  conversationId: string;
  kind: AttachmentKind;
  onProgress?: (
    percentage: number
  ) => void;
}

export async function uploadAttachment({
  file,
  conversationId,
  kind,
  onProgress,
}: UploadAttachmentOptions): Promise<UploadedAttachment> {
  const {
    attachmentId,
    ticket,
  } =
    await apiFetch<UploadTicketResponse>(
      '/attachments/ticket',
      {
        method: 'POST',

        body: JSON.stringify({
          conversationId,
          fileName:
            file.name,
          mimeType:
            file.type ||
            'application/octet-stream',
          sizeBytes:
            file.size,
          kind,
        }),
      }
    );

  const blob =
    await upload(
      file.name,
      file,
      {
        access: 'private',

        handleUploadUrl:
          `${BASE_URL}/attachments/upload`,

        clientPayload:
          ticket,

        multipart:
          file.size >
          5 * 1024 * 1024,

        onUploadProgress({
          percentage,
        }) {
          onProgress?.(
            percentage
          );
        },
      }
    );

  await apiFetch(
    '/attachments/complete',
    {
      method: 'POST',

      body: JSON.stringify({
        attachmentId,
        pathname:
          blob.pathname,
        url:
          blob.url,
      }),
    }
  );

  return {
    attachmentId,
    url:
      blob.url,
    pathname:
      blob.pathname,
    contentType:
      blob.contentType,
    contentDisposition:
      blob.contentDisposition,
  };
}