import { Router } from 'express';
import { handleGetSettingsOptions } from '../controllers/settingsController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/options', asyncHandler(handleGetSettingsOptions));

export default router;
