import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  searchConversations,
  updateConversation,
} from '../services/conversationService.js';
import { toJson, toMarkdown, toPlainText } from '../services/exportService.js';
import { importConversations } from '../services/importService.js';
import { AppError } from '../types/index.js';

export const createConversationSchema = z.object({
  title: z.string().max(200).optional(),
  systemPrompt: z.string().max(8000).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(8192).optional(),
  topP: z.number().min(0).max(1).optional(),
});

export const updateConversationSchema = z.object({
  title: z.string().max(200).optional(),
  systemPrompt: z.string().max(8000).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(8192).optional(),
  topP: z.number().min(0).max(1).optional(),
  pinned: z.boolean().optional(),
});

export async function handleCreateConversation(req: Request, res: Response): Promise<void> {
  const userId = req.auth?.userId ?? 'local-dev-user';
  const conversation = await createConversation(userId, req.body);
  res.status(201).json(conversation);
}

export async function handleListConversations(req: Request, res: Response): Promise<void> {
  const userId = req.auth?.userId ?? 'local-dev-user';
  const q = typeof req.query.q === 'string' ? req.query.q : '';

  const conversations = q
    ? await searchConversations(userId, q)
    : await listConversations(userId);

  res.json(conversations);
}

export async function handleGetConversation(req: Request, res: Response): Promise<void> {
  const userId = req.auth?.userId ?? 'local-dev-user';
  res.json(await getConversation(userId, req.params.id));
}

export async function handleUpdateConversation(req: Request, res: Response): Promise<void> {
  const userId = req.auth?.userId ?? 'local-dev-user';
  res.json(await updateConversation(userId, req.params.id, req.body));
}

export async function handleDeleteConversation(req: Request, res: Response): Promise<void> {
  const userId = req.auth?.userId ?? 'local-dev-user';
  await deleteConversation(userId, req.params.id);
  res.status(204).send();
}

export async function handleExportConversation(req: Request, res: Response): Promise<void> {
  const userId = req.auth?.userId ?? 'local-dev-user';
  const format = (req.query.format as string) ?? 'md';

  const conversation = await getConversation(userId, req.params.id);
  const safeName =
    conversation.title.replace(/[^a-z0-9-_ ]/gi, '').trim() || 'conversation';

  if (format === 'md') {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.md"`);
    res.send(toMarkdown(conversation));
  } else if (format === 'txt') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.txt"`);
    res.send(toPlainText(conversation));
  } else if (format === 'json') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.json"`);
    res.send(toJson(conversation));
  } else {
    throw new AppError(
      `Unsupported export format "${format}". Use md, txt, or json.`,
      400
    );
  }
}

export async function handleImportConversations(req: Request, res: Response): Promise<void> {
  const userId = req.auth?.userId ?? 'local-dev-user';
  const created = await importConversations(userId, req.body);
  res.status(201).json(created);
}