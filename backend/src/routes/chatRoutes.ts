import { Router } from 'express';
import { regenerateMessage, sendMessage, sendMessageSchema, stopGeneration } from '../controllers/chatController.js';
import { validateBody } from '../middleware/validateRequest.js';
import { chatRateLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post(
  '/:conversationId',
  chatRateLimiter,
  validateBody(sendMessageSchema),
  asyncHandler(sendMessage)
);
router.post('/:conversationId/regenerate', chatRateLimiter, asyncHandler(regenerateMessage));
router.post('/:conversationId/stop', stopGeneration);

export default router;
