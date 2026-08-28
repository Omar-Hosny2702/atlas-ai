import { Router } from 'express';

import {
  handleGetSettingsOptions,
  handleGetPreferences,
  handleUpdatePreferences,
  handleGetMemories,
  handleDeleteMemory,
  handleClearMemories,
} from '../controllers/settingsController.js';

import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// This can stay public.
router.get('/options', asyncHandler(handleGetSettingsOptions));

// Everything below this point requires a real logged-in account.
router.use(requireAuth);

router.get('/preferences', asyncHandler(handleGetPreferences));
router.patch('/preferences', asyncHandler(handleUpdatePreferences));

router.get('/memories', asyncHandler(handleGetMemories));
router.delete('/memories/:id', asyncHandler(handleDeleteMemory));
router.delete('/memories', asyncHandler(handleClearMemories));

export default router;