import { upload } from '@vercel/blob/client';

import { apiFetch, BASE_URL } from './client';

export type AttachmentKind =
  | 'image'
  | 'file';

interface UploadTicketResponse {
  ticket: string;
  expiresIn: number;
}

export interface UploadedAttachment {
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
  /*
   * Step 1:
   * Ask Atlas backend for a short-lived,
   * authenticated upload ticket.
   */
  const { ticket } =
    await apiFetch<UploadTicketResponse>(
      '/attachments/ticket',
      {
        method: 'POST',

        body: JSON.stringify({
          conversationId,
          fileName: file.name,
          mimeType:
            file.type ||
            'application/octet-stream',
          sizeBytes: file.size,
          kind,
        }),
      }
    );

  /*
   * Step 2:
   * Upload browser -> Vercel Blob.
   *
   * The actual file does NOT travel through
   * the Atlas Express server.
   */
  const blob = await upload(
    file.name,
    file,
    {
      access: 'public',

      handleUploadUrl:
        `${BASE_URL}/attachments/upload`,

      clientPayload: ticket,

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

  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType:
      blob.contentType,
    contentDisposition:
      blob.contentDisposition,
  };
}