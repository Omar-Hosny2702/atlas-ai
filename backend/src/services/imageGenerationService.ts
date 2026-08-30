import { AppError } from '../types/index.js';

const accountId =
  process.env.CLOUDFLARE_ACCOUNT_ID;

const apiToken =
  process.env.CLOUDFLARE_API_TOKEN;

const IMAGE_MODEL =
  '@cf/black-forest-labs/flux-1-schnell';

export interface GeneratedImage {
  mimeType: string;
  data: string;
}

interface CloudflareImageResponse {
  result?: {
    image?: string;
  };
  success?: boolean;
  errors?: unknown[];
  messages?: unknown[];
}

export async function generateImage(
  prompt: string
): Promise<GeneratedImage> {
  if (!accountId || !apiToken) {
    throw new AppError(
      'Cloudflare image generation is not configured.',
      503
    );
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${IMAGE_MODEL}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Create an image based on this request:\n\n${prompt}\n\nAdd a small, subtle handwritten signature reading "Omar Hosny" in the bottom-right corner.`,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        throw new AppError(
          'Atlas image generation rate limit has been reached. Please try again later.',
          429
        );
      }

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        throw new AppError(
          'Atlas could not authenticate with the image generation service.',
          502
        );
      }

      if (response.status === 400) {
        throw new AppError(
          'The image generation request was rejected by Cloudflare.',
          400
        );
      }

      const errorText =
        await response.text();

      throw new AppError(
        `Cloudflare image generation failed: ${errorText}`,
        502
      );
    }

    const json =
      (await response.json()) as CloudflareImageResponse;

    const image =
      json.result?.image;

    if (!image) {
      throw new AppError(
        'Cloudflare did not return an image.',
        502
      );
    }

    return {
      mimeType: 'image/jpeg',
      data: image,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      'Atlas image generation failed unexpectedly.',
      502
    );
  }
}
