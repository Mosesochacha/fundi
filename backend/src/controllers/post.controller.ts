import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import db from '../models';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';

const AUTHOR_ATTRS = ['id', 'fullName', 'profession', 'location', 'avatarUrl', 'username'];
const COMMENTER_ATTRS = ['id', 'fullName', 'avatarUrl', 'username'];

class PostController {
  createPost = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { content, postType, images } = req.body;
    if (!content?.trim()) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Post content is required');

    const post: any = await db.Post.create({
      content: content.trim(),
      postType: postType || 'SHOWCASE',
      images: Array.isArray(images) ? images : [],
      authorId: req.user!.profileId,
    } as any);

    const full: any = await db.Post.findByPk(post.id, {
      include: [{ model: db.Profile, as: 'author', attributes: AUTHOR_ATTRS }],
    });

    return sendSuccess(res, 'Post created', full!.get({ plain: true }));
  });

  getPost = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const post: any = await db.Post.findByPk(req.params.id, {
      include: [
        { model: db.Profile, as: 'author', attributes: AUTHOR_ATTRS },
        {
          model: db.Comment,
          as: 'comments',
          include: [{ model: db.Profile, as: 'author', attributes: COMMENTER_ATTRS }],
          order: [['createdAt', 'ASC']],
          separate: true,
        },
        ...(req.user
          ? [{ model: db.PostLike, as: 'likes', where: { profileId: req.user.profileId }, required: false, attributes: ['id'] }]
          : []),
      ],
    });

    if (!post) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Post not found');

    const p = post.get({ plain: true });
    return sendSuccess(res, 'Post retrieved', { ...p, likedByMe: req.user ? (p.likes?.length ?? 0) > 0 : false });
  });

  deletePost = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const post: any = await db.Post.findByPk(req.params.id);
    if (!post) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Post not found');
    if (post.authorId !== req.user!.profileId) return sendError(res, HTTP_STATUS.FORBIDDEN, 'You can only delete your own posts');

    await post.destroy();
    return sendSuccess(res, 'Post deleted', { deleted: true });
  });
}

export default new PostController();
