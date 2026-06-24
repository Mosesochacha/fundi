import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/verifyJWT';
import db from '../models';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';

const LIST_ATTRS = ['id', 'type', 'title', 'body', 'link', 'data', 'readAt', 'createdAt'];

class NotificationsController {
  /** GET /notifications — newest first (capped) plus the unread count for the badge. */
  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');

    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const [notifications, unreadCount] = await Promise.all([
      (db as any).Notification.findAll({
        where: { userId },
        attributes: LIST_ATTRS,
        order: [['createdAt', 'DESC']],
        limit,
      }),
      (db as any).Notification.count({ where: { userId, readAt: null } }),
    ]);

    return sendSuccess(res, 'Notifications retrieved', {
      notifications: notifications.map((n: any) => n.get({ plain: true })),
      unreadCount,
    });
  });

  /** POST /notifications/:id/read — mark one as read. */
  markRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');

    await (db as any).Notification.update(
      { readAt: new Date() },
      { where: { id: req.params.id, userId, readAt: null } }
    );
    return sendSuccess(res, 'Marked as read');
  });

  /** POST /notifications/read-all — clear the badge. */
  markAllRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');

    await (db as any).Notification.update(
      { readAt: new Date() },
      { where: { userId, readAt: null } }
    );
    return sendSuccess(res, 'All marked as read');
  });
}

export default new NotificationsController();
