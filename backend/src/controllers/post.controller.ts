import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import db from '../models';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';
import typesenseService from '../services/typesense.service';

const AUTHOR_ATTRS = ['id', 'fullName', 'profession', 'location', 'avatarUrl', 'username'];
const COMMENTER_ATTRS = ['id', 'fullName', 'avatarUrl', 'username'];

function generateSlug(content: string, id: string): string {
  const words = content
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .join('-');
  const prefix = id.split('-')[0];
  return `${words}-${prefix}`;
}

function buildPostIncludes(profileId?: string) {
  return [
    { model: db.Profile, as: 'author', attributes: AUTHOR_ATTRS },
    {
      model: db.Comment,
      as: 'comments',
      include: [{ model: db.Profile, as: 'author', attributes: COMMENTER_ATTRS }],
      order: [['createdAt', 'ASC']],
      separate: true,
    },
    ...(profileId
      ? [{ model: db.PostLike, as: 'likes', where: { profileId }, required: false, attributes: ['id'] }]
      : []),
  ];
}

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

    const slug = generateSlug(post.content, post.id);
    await db.Post.update({ slug }, { where: { id: post.id } });

    const full: any = await db.Post.findByPk(post.id, {
      include: [{ model: db.Profile, as: 'author', attributes: AUTHOR_ATTRS }],
    });

    const p = full!.get({ plain: true });
    typesenseService.upsertPost({
      id:         p.id,
      content:    p.content,
      postType:   p.postType,
      authorId:   p.authorId,
      authorName: p.author?.fullName   || '',
      profession: p.author?.profession || '',
      location:   p.author?.location   || '',
      images:     p.images             || [],
      likesCount: p.likesCount         || 0,
      status:     'PUBLISHED',
      createdAt:  new Date(p.createdAt).getTime(),
    }).catch(() => {});

    return sendSuccess(res, 'Post created', p);
  });

  getPost = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const post: any = await db.Post.findByPk(req.params.id, {
      include: buildPostIncludes(req.user?.profileId),
    });

    if (!post) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Post not found');

    const p = post.get({ plain: true });
    return sendSuccess(res, 'Post retrieved', { ...p, likedByMe: req.user ? (p.likes?.length ?? 0) > 0 : false });
  });

  getPostBySlug = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const post: any = await db.Post.findOne({
      where: { slug: req.params.slug },
      include: buildPostIncludes(req.user?.profileId),
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
    typesenseService.removePost(req.params.id).catch(() => {});
    return sendSuccess(res, 'Post deleted', { deleted: true });
  });
}

export default new PostController();
