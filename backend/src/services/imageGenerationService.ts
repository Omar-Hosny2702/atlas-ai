import { GoogleGenAI } from '@google/genai';
import { AppError } from '../types/index.js';

const apiKey = process.env.GEMINI_API_KEY;

const genAI = apiKey
  ? new GoogleGenAI({ apiKey })
  : null;

const IMAGE_MODEL = 'gemini-3.1-flash-image';

export interface GeneratedImage {
  mimeType: string;
  data: string;
}

export async function generateImage(
  prompt: string
): Promise<GeneratedImage> {
  if (!genAI) {
    throw new AppError(
      'Gemini image generation is not configured.',
      503
    );
  }

  try {
    const response = await genAI.models.generateContent({
      model: IMAGE_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Create an image based on this request:\n\n${prompt}`,
            },
          ],
        },
      ],
    });

    const parts =
      response.candidates?.[0]?.content?.parts ?? [];

    for (const part of parts) {
      if (part.inlineData?.data) {
        return {
          mimeType:
            part.inlineData.mimeType || 'image/png',
          data: part.inlineData.data,
        };
      }
    }

    throw new AppError(
      'The image model did not return an image.',
      502
    );
  } catch (error) {
    const status =
      typeof error === 'object' &&
      error !== null &&
      'status' in error
        ? Number(
            (error as { status?: unknown }).status
          )
        : undefined;

    if (status === 429) {
      throw new AppError(
        'Atlas image generation is temporarily unavailable because the Gemini quota has been reached. Please try again later.',
        429
      );
    }

    if (status === 401 || status === 403) {
      throw new AppError(
        'Atlas could not authenticate with the image generation service.',
        502
      );
    }

    if (status === 400) {
      throw new AppError(
        'The image generation request was rejected by Gemini.',
        400
      );
    }

    throw error;
  }
}