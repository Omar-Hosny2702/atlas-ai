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

export function handleCreateConversation(req: Request, res: Response): void {
  const conversation = createConversation(req.body);
  res.status(201).json(conversation);
}

export function handleListConversations(req: Request, res: Response): void {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  const conversations = q ? searchConversations(q) : listConversations();
  res.json(conversations);
}

export function handleGetConversation(req: Request, res: Response): void {
  res.json(getConversation(req.params.id));
}

export function handleUpdateConversation(req: Request, res: Response): void {
  res.json(updateConversation(req.params.id, req.body));
}

export function handleDeleteConversation(req: Request, res: Response): void {
  deleteConversation(req.params.id);
  res.status(204).send();
}

export function handleExportConversation(req: Request, res: Response): void {
  const format = (req.query.format as string) ?? 'md';
  const conversation = getConversation(req.params.id);
  const safeName = conversation.title.replace(/[^a-z0-9-_ ]/gi, '').trim() || 'conversation';

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
    throw new AppError(`Unsupported export format "${format}". Use md, txt, or json.`, 400);
  }
}

export function handleImportConversations(req: Request, res: Response): void {
  const created = importConversations(req.body);
  res.status(201).json(created);
}
