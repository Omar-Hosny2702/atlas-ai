import { Router } from 'express';

import {
  generateImageSchema,
  handleGenerateImage,
} from '../controllers/actionController.js';

import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/image',
  asyncHandler(async (req, res) => {
    req.body = generateImageSchema.parse(req.body);
    await handleGenerateImage(req, res);
  })
);

export default router;