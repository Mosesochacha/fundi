import { Response } from 'express';
import { Op } from 'sequelize';
import { AuthenticatedRequest } from '../middleware/verifyJWT';
import db from '../models';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';

class SessionsController {
  getSessions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const sessions = await db.RefreshToken.findAll({
      where: {
        userId: req.user!.id,
        isRevoked: false,
        expiresAt: { [Op.gt]: new Date() },
      },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'ipAddress', 'userAgent', 'createdAt', 'expiresAt'],
    });
    return sendSuccess(res, 'Sessions retrieved', sessions.map((s: any) => s.get({ plain: true })));
  });

  revokeSession = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const session = await db.RefreshToken.findOne({
      where: { id, userId: req.user!.id, isRevoked: false },
    });
    if (!session) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Session not found');
    await session.update({ isRevoked: true });
    return sendSuccess(res, 'Session revoked');
  });

  revokeAllOtherSessions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const currentJti = (req as any).jti;
    await db.RefreshToken.update(
      { isRevoked: true },
      {
        where: {
          userId: req.user!.id,
          isRevoked: false,
          ...(currentJti ? { id: { [Op.ne]: currentJti } } : {}),
        },
      }
    );
    return sendSuccess(res, 'All other sessions revoked');
  });

  getLoginHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 5;
    const history = await db.LoginHistory.findAll({
      where: { userId: req.user!.id },
      order: [['createdAt', 'DESC']],
      limit: Math.min(limit, 30),
      attributes: ['id', 'ipAddress', 'userAgent', 'city', 'country', 'status', 'createdAt'],
    });
    return sendSuccess(res, 'Login history retrieved', history.map((h: any) => {
      const item = h.get({ plain: true });
      if (item.ipAddress) {
        const parts = item.ipAddress.split('.');
        if (parts.length === 4) {
          item.ipAddress = `${parts[0]}.${parts[1]}.*.*`;
        }
      }
      return item;
    }));
  });
}

export default new SessionsController();
