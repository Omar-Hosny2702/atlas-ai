import { Router } from 'express';

import {
  handleCreateUploadTicket,
  handleAttachmentUpload,
  handleCompleteAttachmentUpload,
  handleGetAttachmentContent,
} from '../controllers/attachmentController.js';

import {
  requireAuth,
} from '../middleware/auth.js';

const router =
  Router();

router.post(
  '/ticket',
  requireAuth,
  handleCreateUploadTicket
);

router.post(
  '/upload',
  handleAttachmentUpload
);

router.post(
  '/complete',
  requireAuth,
  handleCompleteAttachmentUpload
);

router.get(
  '/:attachmentId/content',
  requireAuth,
  handleGetAttachmentContent
);

export default router;