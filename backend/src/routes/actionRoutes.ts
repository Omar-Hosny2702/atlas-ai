import { Router } from 'express';

import {
  generateImageSchema,
  researchSchema,
  explainSchema,
  planSchema,
  handleGenerateImage,
  handleResearch,
  handleExplain,
  handlePlan,
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

router.post(
  '/explain',
  asyncHandler(async (req, res) => {
    req.body = explainSchema.parse(req.body);
    await handleExplain(req, res);
  })
);

router.post(
  '/plan',
  asyncHandler(async (req, res) => {
    req.body = planSchema.parse(req.body);
    await handlePlan(req, res);
  })
);

export default router;