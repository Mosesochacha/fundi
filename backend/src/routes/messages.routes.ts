import { Router } from 'express';
import MessagesController from '../controllers/messages.controller';

const router = Router();

router.get('/messages/conversations', MessagesController.getConversations);
router.get('/messages/:conversationId', MessagesController.getMessages);
router.post('/messages', MessagesController.sendMessage);
router.post('/messages/:conversationId/read', MessagesController.markRead);

export default router;
