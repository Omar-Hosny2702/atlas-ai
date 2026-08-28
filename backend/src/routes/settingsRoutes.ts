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

const router = Router();

router.get('/options', asyncHandler(handleGetSettingsOptions));

router.get('/preferences', asyncHandler(handleGetPreferences));
router.patch('/preferences', asyncHandler(handleUpdatePreferences));

router.get('/memories', asyncHandler(handleGetMemories));
router.delete('/memories/:id', asyncHandler(handleDeleteMemory));
router.delete('/memories', asyncHandler(handleClearMemories));

export default router;