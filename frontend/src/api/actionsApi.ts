import { apiFetch } from './client';

export interface GeneratedImage {
  type: 'image';
  mimeType: string;
  data: string;
  attachmentId: string;
}

export function generateImage(
  prompt: string,
  conversationId: string
): Promise<GeneratedImage> {
  return apiFetch<GeneratedImage>(
    '/actions/image',
    {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        conversationId,
      }),
    }
  );
}