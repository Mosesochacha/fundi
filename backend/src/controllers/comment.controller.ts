import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import db from '../models';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';

const COMMENTER_ATTRS = ['id', 'fullName', 'avatarUrl', 'username'];

class CommentController {
  getComments = asyncHandler(async (req: Request, res: Response) => {
    const comments = await db.Comment.findAll({
      where: { postId: req.params.id },
      include: [{ model: db.Profile, as: 'author', attributes: COMMENTER_ATTRS }],
      order: [['createdAt', 'ASC']],
    });
    return sendSuccess(res, comments.map((c: any) => c.get({ plain: true })));
  });

  addComment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { content } = req.body;
    if (!content?.trim()) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Comment content is required');
    }

    const comment: any = await db.Comment.create({
      content: content.trim(),
      postId: req.params.id,
      authorId: req.user!.profileId,
    } as any);

    await db.Post.increment('commentsCount', { where: { id: req.params.id } });

    const full: any = await db.Comment.findByPk(comment.id, {
      include: [{ model: db.Profile, as: 'author', attributes: COMMENTER_ATTRS }],
    });

    return sendSuccess(res, full!.get({ plain: true }), HTTP_STATUS.CREATED);
  });
}

export default new CommentController();
