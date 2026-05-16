import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import db from '../models';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';

const COMMENTER_ATTRS = ['id', 'fullName', 'avatarUrl', 'username'];

function buildLikeInclude(profileId: string) {
  return { model: db.CommentLike, as: 'commentLikes', where: { profileId }, required: false, attributes: ['id'] };
}

class CommentController {
  getComments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profileId = req.user?.profileId;

    const comments = await db.Comment.findAll({
      where: { postId: req.params.id, parentCommentId: null },
      include: [
        { model: db.Profile, as: 'author', attributes: COMMENTER_ATTRS },
        {
          model: db.Comment,
          as: 'replies',
          separate: true,
          include: [
            { model: db.Profile, as: 'author', attributes: COMMENTER_ATTRS },
            ...(profileId ? [buildLikeInclude(profileId)] : []),
          ],
          order: [['createdAt', 'ASC']],
        },
        ...(profileId ? [buildLikeInclude(profileId)] : []),
      ],
      order: [['createdAt', 'ASC']],
    });

    const data = comments.map((c: any) => {
      const plain = c.get({ plain: true });
      return {
        ...plain,
        likedByMe: profileId ? (plain.commentLikes?.length ?? 0) > 0 : false,
        replies: (plain.replies ?? []).map((r: any) => ({
          ...r,
          likedByMe: profileId ? (r.commentLikes?.length ?? 0) > 0 : false,
        })),
      };
    });

    return sendSuccess(res, 'Comments retrieved', data);
  });

  addComment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { content, parentCommentId } = req.body;
    if (!content?.trim()) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Comment content is required');

    if (parentCommentId) {
      const parent: any = await db.Comment.findOne({ where: { id: parentCommentId, postId: req.params.id } });
      if (!parent) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Parent comment not found');
      if (parent.parentCommentId) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Cannot reply to a reply');
    }

    const comment: any = await db.Comment.create({
      content: content.trim(),
      postId: req.params.id,
      authorId: req.user!.profileId,
      parentCommentId: parentCommentId ?? null,
    } as any);

    if (!parentCommentId) {
      await db.Post.increment('commentsCount', { where: { id: req.params.id } });
    }

    const full: any = await db.Comment.findByPk(comment.id, {
      include: [{ model: db.Profile, as: 'author', attributes: COMMENTER_ATTRS }],
    });

    const plain = full!.get({ plain: true });
    return sendSuccess(res, 'Comment added', { ...plain, likedByMe: false, replies: [] });
  });

  toggleCommentLike = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { commentId } = req.params;
    const profileId = req.user!.profileId;

    const comment: any = await db.Comment.findByPk(commentId, { attributes: ['id', 'likesCount'] });
    if (!comment) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Comment not found');

    const existing: any = await db.CommentLike.findOne({ where: { commentId, profileId } });

    if (existing) {
      await existing.destroy();
      await db.Comment.decrement('likesCount', { where: { id: commentId } });
      const updated: any = await db.Comment.findByPk(commentId, { attributes: ['likesCount'] });
      return sendSuccess(res, 'Unliked', { liked: false, likesCount: Math.max(0, updated.likesCount) });
    }

    await db.CommentLike.create({ commentId, profileId } as any);
    await db.Comment.increment('likesCount', { where: { id: commentId } });
    const updated: any = await db.Comment.findByPk(commentId, { attributes: ['likesCount'] });
    return sendSuccess(res, 'Liked', { liked: true, likesCount: updated.likesCount });
  });
}

export default new CommentController();
