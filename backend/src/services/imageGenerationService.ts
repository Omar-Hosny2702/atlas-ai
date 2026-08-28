import { GoogleGenAI } from '@google/genai';
import { config } from '../config/config.js';
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

  const parts = response.candidates?.[0]?.content?.parts ?? [];

  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        mimeType: part.inlineData.mimeType || 'image/png',
        data: part.inlineData.data,
      };
    }
  }

  throw new AppError(
    'The image model did not return an image.',
    502
  );
}