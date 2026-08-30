import sharp from 'sharp';

import {
  AppError,
} from '../types/index.js';

const accountId =
  process.env.CLOUDFLARE_ACCOUNT_ID;

const apiToken =
  process.env.CLOUDFLARE_API_TOKEN;

const GENERATION_MODEL =
  '@cf/black-forest-labs/flux-1-schnell';

const EDIT_MODEL =
  '@cf/black-forest-labs/flux-2-klein-4b';

export interface GeneratedImage {
  mimeType: string;
  data: string;
}

interface CloudflareImageResponse {
  result?: {
    image?: string;
  };

  success?: boolean;
  errors?: Array<{
    message?: string;
    code?: number;
  }>;

  messages?: unknown[];
}

function ensureConfigured(): void {
  if (
    !accountId ||
    !apiToken
  ) {
    throw new AppError(
      'Cloudflare image generation is not configured.',
      503
    );
  }
}

function handleCloudflareError(
  status: number,
  errorText: string
): never {
  if (
    status ===
    429
  ) {
    throw new AppError(
      'Atlas image generation rate limit has been reached. Please try again later.',
      429
    );
  }

  if (
    status ===
      401 ||
    status ===
      403
  ) {
    throw new AppError(
      'Atlas could not authenticate with the image generation service.',
      502
    );
  }

  throw new AppError(
    `Cloudflare image generation failed: ${errorText}`,
    502
  );
}

export async function generateImage(
  prompt: string
): Promise<GeneratedImage> {
  ensureConfigured();

  try {
    /*
     * Keep ordinary generation on FLUX.1
     * Schnell. It has already proven reliable
     * for Atlas.
     *
     * FLUX.2 Klein is reserved for editing.
     */
    const response =
      await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${GENERATION_MODEL}`,
        {
          method:
            'POST',

          headers: {
            Authorization:
              `Bearer ${apiToken}`,

            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify({
              prompt: `${prompt}

Create a high-quality image matching the request.

Add one small subtle handwritten signature reading "Omar Hosny" in the bottom-right corner.`,
            }),
        }
      );

    if (
      !response.ok
    ) {
      const errorText =
        await response.text();

      handleCloudflareError(
        response.status,
        errorText
      );
    }

    const json =
      (
        await response.json()
      ) as CloudflareImageResponse;

    const image =
      json.result?.image;

    if (!image) {
      throw new AppError(
        'Cloudflare did not return an image.',
        502
      );
    }

    return {
      mimeType:
        'image/jpeg',

      data:
        image,
    };
  } catch (error) {
    if (
      error instanceof
      AppError
    ) {
      throw error;
    }

    throw new AppError(
      'Atlas image generation failed unexpectedly.',
      502
    );
  }
}

export async function editImage(
  prompt: string,
  inputData: Buffer
): Promise<GeneratedImage> {
  ensureConfigured();

  try {
    /*
     * Klein reference images must be below
     * 512x512, so only the Cloudflare input
     * copy is resized.
     */
    const resized =
      await sharp(
        inputData
      )
        .rotate()
        .resize({
          width:
            511,

          height:
            511,

          fit:
            'inside',

          withoutEnlargement:
            true,
        })
        .jpeg({
          quality:
            92,
        })
        .toBuffer();

    const form =
      new FormData();

    form.append(
      'prompt',
      `Modify image 0 according to this request:

${prompt}

Preserve everything that the user did not ask to change.

Keep one subtle handwritten "Omar Hosny" signature in the bottom-right corner.`
    );

    form.append(
      'input_image_0',
      new Blob(
        [
          resized,
        ],
        {
          type:
            'image/jpeg',
        }
      ),
      'atlas-reference.jpg'
    );

    form.append(
      'width',
      '1024'
    );

    form.append(
      'height',
      '1024'
    );

    const response =
      await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${EDIT_MODEL}`,
        {
          method:
            'POST',

          headers: {
            Authorization:
              `Bearer ${apiToken}`,
          },

          body:
            form,
        }
      );

    if (
      !response.ok
    ) {
      const errorText =
        await response.text();

      handleCloudflareError(
        response.status,
        errorText
      );
    }

    const json =
      (
        await response.json()
      ) as CloudflareImageResponse;

    const image =
      json.result?.image;

    if (!image) {
      throw new AppError(
        'Cloudflare did not return an edited image.',
        502
      );
    }

    return {
      mimeType:
        'image/jpeg',

      data:
        image,
    };
  } catch (error) {
    if (
      error instanceof
      AppError
    ) {
      throw error;
    }

    throw new AppError(
      'Atlas image editing failed unexpectedly.',
      502
    );
  }
}
