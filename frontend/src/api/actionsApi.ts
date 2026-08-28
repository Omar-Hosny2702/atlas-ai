import { apiFetch } from './client';

export interface GeneratedImage {
  type: 'image';
  mimeType: string;
  data: string;
}

export function generateImage(prompt: string): Promise<GeneratedImage> {
  return apiFetch<GeneratedImage>('/actions/image', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
}