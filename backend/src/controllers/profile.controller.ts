import { Response } from 'express';
import { Op } from 'sequelize';
import { AuthenticatedRequest } from '../middleware/verifyJWT';
import db from '../models';
import { sendSuccess, sendError, asyncHandler, paginate } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';
import typesenseService from '../services/typesense.service';

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
    const p = profile.get({ plain: true });
    typesenseService.updateProfile(p.id, {
      fullName:   p.fullName,
      username:   p.username,
      profession: p.profession,
      location:   p.location,
      bio:        p.bio,
      services:   p.services   || [],
      avatarUrl:  p.avatarUrl,
      theme:      p.theme,
    });
    return sendSuccess(res, 'Profile updated', p);
  });

  publishProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');

    const profile: any = await db.Profile.findOne({ where: { userId } });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');

    if (!profile.profession?.trim() || !profile.location?.trim()) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Profession and location are required before publishing');
    }

    await Promise.all([
      profile.update({ profilePublic: true }),
      db.User.update(
        { isOnboarded: true, onboardingCompletedAt: new Date() },
        { where: { id: userId } }
      ),
    ]);

    typesenseService.upsertProfile({
      id:           profile.id,
      fullName:     profile.fullName,
      username:     profile.username,
      profession:   profile.profession,
      location:     profile.location,
      bio:          profile.bio          || '',
      services:     profile.services     || [],
      avatarUrl:    profile.avatarUrl    || '',
      theme:        profile.theme        || '',
      profileViews: profile.views        || 0,
      isPublished:  true,
      createdAt:    new Date(profile.createdAt).getTime(),
    }).catch(() => {});

    const BASE = process.env.FRONTEND_URL || 'http://localhost:3000';
    return sendSuccess(res, 'Profile published', {
      profileUrl: `${BASE}/${profile.username}`,
      profile: profile.get({ plain: true }),
    });
  });

  browseProfiles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profession = ((req.query.profession as string) || '').trim();
    const location = ((req.query.location as string) || '').trim();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const { skip } = paginate(page, limit);

    const where: any = { profilePublic: true, appearInSearch: true };
    if (profession) where.profession = { [Op.iLike]: `%${profession}%` };
    if (location) where.location = { [Op.iLike]: `%${location}%` };

    const followersSubquery = db.sequelize.literal(
      '(SELECT COUNT(*) FROM "Follows" WHERE "followingId" = "Profile"."id")'
    );

    const { count: total, rows } = await db.Profile.findAndCountAll({
      where,
      attributes: {
        include: [[followersSubquery, 'followersCount']],
      },
      order: [
        [db.sequelize.literal('(SELECT COUNT(*) FROM "Follows" WHERE "followingId" = "Profile"."id")'), 'DESC'],
        ['views', 'DESC'],
      ],
      offset: skip,
      limit,
    });

    return sendSuccess(res, 'Profiles found', {
      profiles: rows.map((p: any) => p.get({ plain: true })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  });

  searchProfiles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const q = ((req.query.q as string) || '').trim();
    if (q.length < 2) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Query too short');

    const profiles = await db.Profile.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.iLike]: `%${q}%` } },
          { fullName: { [Op.iLike]: `%${q}%` } },
        ],
        profilePublic: true,
      },
      attributes: ['username', 'fullName', 'avatarUrl'],
      limit: 8,
    });

    return sendSuccess(res, 'Profiles found', profiles.map((p: any) => p.get({ plain: true })));
  });

  checkUsernamePublic = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const u = ((req.query.u as string) || '').trim().toLowerCase();
    if (!u || u.length < 3) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Username too short');
    if (!/^[a-z0-9_]{3,30}$/.test(u)) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid username format');
    const existing = await db.Profile.findOne({ where: { username: u } });
    const available = !existing;
    const suggestion = available ? null : `${u}${Math.floor(Math.random() * 900) + 100}`;
    return sendSuccess(res, available ? 'Username available' : 'Username taken', { available, suggestion });
  });
}

export default new ProfileController();
