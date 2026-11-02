import { Router } from 'express';
import {
  createConversationSchema,
  handleCreateConversation,
  handleDeleteConversation,
  handleExportConversation,
  handleGetConversation,
  handleImportConversations,
  handleListConversations,
  handleUpdateConversation,
  updateConversationSchema,
} from '../controllers/conversationController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validateRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(handleListConversations));
router.post('/', validateBody(createConversationSchema), asyncHandler(handleCreateConversation));

// Import must be registered before "/:id" so "import" isn't parsed as an id.
router.post('/import', asyncHandler(handleImportConversations));

router.get('/:id', asyncHandler(handleGetConversation));
router.patch('/:id', validateBody(updateConversationSchema), asyncHandler(handleUpdateConversation));
router.delete('/:id', asyncHandler(handleDeleteConversation));
router.get('/:id/export', asyncHandler(handleExportConversation));

export default router;
