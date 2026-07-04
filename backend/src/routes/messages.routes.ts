import { Router } from 'express';
import MessagesController from '../controllers/messages.controller';
import { uploadMessageImage } from '../middleware/upload';
import { messageRateLimit } from '../middleware/rateLimiter';

const router = Router();

router.get('/messages/conversations', MessagesController.getConversations);
router.post('/messages/upload', messageRateLimit, uploadMessageImage, MessagesController.uploadAttachment);
router.get('/messages/:conversationId', MessagesController.getMessages);
router.post('/messages', messageRateLimit, MessagesController.sendMessage);
router.post('/messages/:conversationId/read', MessagesController.markRead);

export default router;
