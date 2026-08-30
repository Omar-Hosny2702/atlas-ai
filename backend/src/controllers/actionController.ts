import crypto from 'node:crypto';

import type { Request, Response } from 'express';
import { z } from 'zod';
import { put } from '@vercel/blob';

import {
  addMessage,
  maybeAutoTitle,
} from '../services/conversationService.js';

import { generateImage } from '../services/imageGenerationService.js';
import { getDatabase } from '../db/database.js';
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

  conversationId: z
    .string()
    .min(1, 'Conversation is required.'),
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
  const userId =
    req.auth!.userId;

  const {
    prompt,
    conversationId,
  } =
    generateImageSchema.parse(
      req.body
    );

  const originalContent =
    `/atlas image ${prompt}`;

  await addMessage(
    userId,
    conversationId,
    'user',
    originalContent
  );

  const image =
    await generateImage(
      prompt
    );

  const attachmentId =
    crypto.randomUUID();

  const extension =
    image.mimeType === 'image/png'
      ? 'png'
      : image.mimeType === 'image/webp'
        ? 'webp'
        : 'jpg';

  const fileName =
    `atlas-generated-${attachmentId}.${extension}`;

  const pathname =
    `atlas-generated/${conversationId}/${fileName}`;

  const bytes =
    Buffer.from(
      image.data,
      'base64'
    );

  const blob =
    await put(
      pathname,
      bytes,
      {
        access:
          'private',

        contentType:
          image.mimeType,

        addRandomSuffix:
          false,
      }
    );

  const sql =
    await getDatabase();

  await sql`
    INSERT INTO attachments (
      id,
      user_id,
      conversation_id,
      file_name,
      mime_type,
      size_bytes,
      kind,
      storage_provider,
      storage_key,
      storage_url,
      status
    )
    VALUES (
      ${attachmentId},
      ${userId},
      ${conversationId},
      ${fileName},
      ${image.mimeType},
      ${bytes.length},
      'image',
      'vercel-blob',
      ${blob.pathname},
      ${blob.url},
      'uploaded'
    )
  `;

  await addMessage(
    userId,
    conversationId,
    'assistant',
    '',
    {
      metadata: {
        generatedImage: {
          attachmentId,
          storageUrl:
            blob.url,
          mimeType:
            image.mimeType,
          alt:
            prompt,
        },
      },
    }
  );

  await maybeAutoTitle(
    userId,
    conversationId,
    prompt
  );

  res.json({
    type:
      'image',

    mimeType:
      image.mimeType,

    data:
      image.data,

    attachmentId,
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