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
import { validateBody } from '../middleware/validateRequest.js';

const router = Router();

router.get('/', handleListConversations);
router.post('/', validateBody(createConversationSchema), handleCreateConversation);

// Import must be registered before "/:id" so "import" isn't parsed as an id.
router.post('/import', handleImportConversations);

router.get('/:id', handleGetConversation);
router.patch('/:id', validateBody(updateConversationSchema), handleUpdateConversation);
router.delete('/:id', handleDeleteConversation);
router.get('/:id/export', handleExportConversation);

export default router;
