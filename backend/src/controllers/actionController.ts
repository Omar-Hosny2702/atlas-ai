import type { Request, Response } from 'express';
import { z } from 'zod';

import {
  addMessage,
  maybeAutoTitle,
} from '../services/conversationService.js';

import { generateImage } from '../services/imageGenerationService.js';
import { researchTopic } from '../services/researchService.js';

import {
  explainTopic,
  planGoal,
} from '../services/textActionService.js';

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

  conversationId: z.string().min(1),
});

export const explainSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(1, 'Explain topic cannot be empty.')
    .max(4000, 'Explain topic is too long.'),

  conversationId: z.string().min(1),
});

export const planSchema = z.object({
  goal: z
    .string()
    .trim()
    .min(1, 'Plan goal cannot be empty.')
    .max(4000, 'Plan goal is too long.'),

  conversationId: z.string().min(1),
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
  const userId = req.auth!.userId;

  const { query, conversationId } =
    researchSchema.parse(req.body);

  const originalContent =
    `/atlas research ${query}`;

  await addMessage(
    userId,
    conversationId,
    'user',
    originalContent
  );

  const result =
    await researchTopic(query);

  await addMessage(
    userId,
    conversationId,
    'assistant',
    result.answer,
    {
      metadata: {
        research: {
          sources:
            result.sources,
          searchQueries:
            result.searchQueries,
        },
      },
    }
  );

  await maybeAutoTitle(
    userId,
    conversationId,
    query
  );

  res.json({
    type: 'research',
    ...result,
  });
}

export async function handleExplain(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.auth!.userId;

  const { topic, conversationId } =
    explainSchema.parse(req.body);

  const originalContent = `/atlas explain ${topic}`;

  await addMessage(
    userId,
    conversationId,
    'user',
    originalContent
  );

  const answer = await explainTopic(topic);

  await addMessage(
    userId,
    conversationId,
    'assistant',
    answer
  );

  await maybeAutoTitle(
    userId,
    conversationId,
    topic
  );

  res.json({
    type: 'explain',
    answer,
  });
}

export async function handlePlan(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.auth!.userId;

  const { goal, conversationId } =
    planSchema.parse(req.body);

  const originalContent = `/atlas plan ${goal}`;

  await addMessage(
    userId,
    conversationId,
    'user',
    originalContent
  );

  const answer = await planGoal(goal);

  await addMessage(
    userId,
    conversationId,
    'assistant',
    answer
  );

  await maybeAutoTitle(
    userId,
    conversationId,
    goal
  );

  res.json({
    type: 'plan',
    answer,
  });
}