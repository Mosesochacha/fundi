import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import db from '../models';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';

class LikeController {
  toggleLike = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const postId = req.params.id;
    const profileId = req.user!.profileId;

    const post: any = await db.Post.findByPk(postId, { attributes: ['id', 'likesCount'] });
    if (!post) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Post not found');

    const existing: any = await db.PostLike.findOne({ where: { postId, profileId } });

    if (existing) {
      await existing.destroy();
      await db.Post.decrement('likesCount', { where: { id: postId } });
      const updated: any = await db.Post.findByPk(postId, { attributes: ['likesCount'] });
      return sendSuccess(res, 'Unliked', { liked: false, likesCount: Math.max(0, updated.likesCount) });
    }

    await db.PostLike.create({ postId, profileId } as any);
    await db.Post.increment('likesCount', { where: { id: postId } });
    const updated: any = await db.Post.findByPk(postId, { attributes: ['likesCount'] });
    return sendSuccess(res, 'Liked', { liked: true, likesCount: updated.likesCount });
  });
}

export default new LikeController();
