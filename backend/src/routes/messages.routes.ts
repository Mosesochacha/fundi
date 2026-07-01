import { Router } from 'express';
import MessagesController from '../controllers/messages.controller';
import { uploadMessageImage } from '../middleware/upload';

const router = Router();

router.get('/messages/conversations', MessagesController.getConversations);
router.post('/messages/upload', uploadMessageImage, MessagesController.uploadAttachment);
router.get('/messages/:conversationId', MessagesController.getMessages);
router.post('/messages', MessagesController.sendMessage);
router.post('/messages/:conversationId/read', MessagesController.markRead);

export default router;
