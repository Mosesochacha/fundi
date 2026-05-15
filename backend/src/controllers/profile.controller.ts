import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/verifyJWT';
import db from '../models';
import { sendSuccess, sendError, asyncHandler, paginate } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';

const AUTHOR_ATTRS = ['id', 'fullName', 'profession', 'location', 'avatarUrl', 'username'];

class ProfileController {
  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile: any = await db.Profile.findOne({
      where: { username: req.params.username },
      include: [
        ...(req.user
          ? [{ model: db.Follow, as: 'followers', where: { followerId: req.user.profileId }, required: false, attributes: ['id'] }]
          : []),
      ],
    });

    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');

    const [followersCount, followingCount, postsCount] = await Promise.all([
      db.Follow.count({ where: { followingId: profile.id } }),
      db.Follow.count({ where: { followerId: profile.id } }),
      db.Post.count({ where: { authorId: profile.id } }),
    ]);

    // Fire-and-forget view increment
    db.Profile.increment('views', { where: { id: profile.id } }).catch(() => {});

    const p = profile.get({ plain: true });
    return sendSuccess(res, 'Profile retrieved', {
      ...p,
      followersCount,
      followingCount,
      postsCount,
      isFollowing: req.user ? (p.followers?.length ?? 0) > 0 : false,
    });
  });

  getProfilePosts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { username } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const { skip, take } = paginate(page, limit);

    const profile: any = await db.Profile.findOne({ where: { username }, attributes: ['id'] });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');

    const posts = await db.Post.findAll({
      where: { authorId: profile.id },
      offset: skip,
      limit: take,
      order: [['createdAt', 'DESC']],
      include: [
        { model: db.Profile, as: 'author', attributes: AUTHOR_ATTRS },
        ...(req.user
          ? [{ model: db.PostLike, as: 'likes', where: { profileId: req.user.profileId }, required: false, attributes: ['id'] }]
          : []),
      ],
    });

    return sendSuccess(res, 'Posts retrieved', posts.map((post: any) => {
      const p = post.get({ plain: true });
      return { ...p, likedByMe: req.user ? (p.likes?.length ?? 0) > 0 : false };
    }));
  });
  updateMyProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');

    const profile: any = await db.Profile.findOne({ where: { userId } });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');

    const ALLOWED = [
      'fullName', 'username', 'profession', 'location', 'bio', 'tagline',
      'phone', 'whatsapp', 'yearsExperience', 'services', 'theme',
      'displayNameFormat', 'profileLayout',
    ];

    const updates: Record<string, any> = {};
    for (const key of ALLOWED) {
      if (key in req.body) updates[key] = req.body[key];
    }

    // Validate username uniqueness if changing
    if (updates.username && updates.username !== profile.username) {
      const usernameRegex = /^[a-z0-9_]{3,30}$/;
      if (!usernameRegex.test(updates.username)) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid username format');
      }
      const existing = await db.Profile.findOne({ where: { username: updates.username } });
      if (existing) return sendError(res, HTTP_STATUS.CONFLICT, 'Username is already taken');
    }

    await profile.update(updates);
    return sendSuccess(res, 'Profile updated', profile.get({ plain: true }));
  });
}

export default new ProfileController();
