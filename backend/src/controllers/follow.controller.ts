import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import db from '../models';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';

class FollowController {
  toggleFollow = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const followerId = req.user!.profileId;
    const followingId = req.params.profileId;

    if (followerId === followingId) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Cannot follow yourself');
    }

    const target: any = await db.Profile.findByPk(followingId, { attributes: ['id'] });
    if (!target) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');

    const existing: any = await db.Follow.findOne({ where: { followerId, followingId } });

    if (existing) {
      await existing.destroy();
      return sendSuccess(res, 'Unfollowed', { following: false });
    }

    await db.Follow.create({ followerId, followingId } as any);
    return sendSuccess(res, 'Followed', { following: true });
  });
}

export default new FollowController();
