import { Router } from 'express';

import {
  handleGetSettingsOptions,
  handleGetPreferences,
  handleUpdatePreferences,
  handleGetMemories,
  handleAddMemory,
  handleDeleteMemory,
  handleClearMemories,
} from '../controllers/settingsController.js';

import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Public settings information
router.get(
  '/options',
  asyncHandler(handleGetSettingsOptions)
);

// Everything below requires a logged-in account
router.use(requireAuth);

// Personalisation
router.get(
  '/preferences',
  asyncHandler(handleGetPreferences)
);

router.patch(
  '/preferences',
  asyncHandler(handleUpdatePreferences)
);

// Memory
router.get(
  '/memories',
  asyncHandler(handleGetMemories)
);

router.post(
  '/memories',
  asyncHandler(handleAddMemory)
);

router.delete(
  '/memories/:id',
  asyncHandler(handleDeleteMemory)
);

router.delete(
  '/memories',
  asyncHandler(handleClearMemories)
);

export default router;