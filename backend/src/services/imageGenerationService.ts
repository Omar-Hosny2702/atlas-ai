import sharp from 'sharp';

import {
  AppError,
} from '../types/index.js';

const accountId =
  process.env.CLOUDFLARE_ACCOUNT_ID;

const apiToken =
  process.env.CLOUDFLARE_API_TOKEN;

const IMAGE_MODEL =
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
  errors?: unknown[];
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

async function runFlux(
  form: FormData
): Promise<GeneratedImage> {
  ensureConfigured();

  try {
    const response =
      await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${IMAGE_MODEL}`,
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
      if (
        response.status ===
        429
      ) {
        throw new AppError(
          'Atlas image generation rate limit has been reached. Please try again later.',
          429
        );
      }

      if (
        response.status ===
          401 ||
        response.status ===
          403
      ) {
        throw new AppError(
          'Atlas could not authenticate with the image generation service.',
          502
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

export async function generateImage(
  prompt: string
): Promise<GeneratedImage> {
  const form =
    new FormData();

  form.append(
    'prompt',
    `Create a high-quality image based on this request:

${prompt}

Follow all explicit details in the request closely, including requested numbers of people or objects.

Unless the user asks for a particular artistic style, prefer realistic photographic detail.

Add exactly one small subtle handwritten signature reading "Omar Hosny" in the bottom-right corner.`
  );

  form.append(
    'width',
    '1024'
  );

  form.append(
    'height',
    '1024'
  );

  return runFlux(
    form
  );
}

export async function editImage(
  prompt: string,
  inputData: Buffer
): Promise<GeneratedImage> {
  /*
   * FLUX.2 Klein requires reference images
   * below 512x512.
   *
   * Resize only the reference copy sent to
   * Cloudflare. The original stored image
   * remains untouched.
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
    `Edit image 0 according to this instruction:

${prompt}

Keep the same subjects, identity, composition, clothing, objects, environment and other visual details unless the user specifically asks to change them.

Preserve continuity with image 0.

Keep exactly one subtle handwritten "Omar Hosny" signature in the bottom-right corner.`
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

  return runFlux(
    form
  );
}
