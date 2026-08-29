import { Router } from 'express';

import {
  handleCreateUploadTicket,
  handleAttachmentUpload,
} from '../controllers/attachmentController.js';

import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Authenticated Atlas user asks for a short-lived upload ticket.
router.post(
  '/ticket',
  requireAuth,
  handleCreateUploadTicket
);

// Vercel Blob uses this endpoint for the upload handshake/callback.
// Authentication is handled using the signed upload ticket.
router.post(
  '/upload',
  handleAttachmentUpload
);

export default router;