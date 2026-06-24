import { Router } from 'express';
import NotificationsController from '../controllers/notifications.controller';

const router = Router();

router.get('/notifications', NotificationsController.list);
router.post('/notifications/read-all', NotificationsController.markAllRead);
router.post('/notifications/:id/read', NotificationsController.markRead);

export default router;
