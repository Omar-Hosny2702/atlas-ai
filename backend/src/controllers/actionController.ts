import type { Request, Response } from 'express';
import { z } from 'zod';

import { generateImage } from '../services/imageGenerationService.js';
import { researchTopic } from '../services/researchService.js';

export const generateImageSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, 'Image prompt cannot be empty.')
    .max(4000, 'Image prompt is too long.'),
});

export const researchSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, 'Research query cannot be empty.')
    .max(4000, 'Research query is too long.'),
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

export async function handleResearch(
  req: Request,
  res: Response
): Promise<void> {
  const { query } = researchSchema.parse(req.body);

  const result = await researchTopic(query);

  res.json({
    type: 'research',
    ...result,
  });
}