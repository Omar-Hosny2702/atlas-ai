import { Router } from 'express';
import { checkOllamaHealth } from '../services/llmService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const ollama = await checkOllamaHealth();
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      ollama,
    });
  })
);

export default router;
