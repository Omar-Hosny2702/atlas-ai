import { Router } from 'express';

import {
  generateImageSchema,
  researchSchema,
  handleGenerateImage,
  handleResearch,
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

router.post(
  '/research',
  asyncHandler(async (req, res) => {
    req.body = researchSchema.parse(req.body);
    await handleResearch(req, res);
  })
);

export default router;