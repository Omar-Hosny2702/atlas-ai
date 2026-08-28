import type { Request, Response } from 'express';
import { z } from 'zod';

import { generateImage } from '../services/imageGenerationService.js';

export const generateImageSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Image prompt cannot be empty.')
    .max(4000, 'Image prompt is too long.'),
});

export async function handleGenerateImage(
  req: Request,
  res: Response
): Promise<void> {
  const { prompt } = generateImageSchema.parse(req.body);

  const image = await generateImage(prompt);

  res.json({
    type: 'image',
    mimeType: image.mimeType,
    data: image.data,
  });
}