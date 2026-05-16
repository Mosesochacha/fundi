import crypto from 'crypto';
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

    // Track view with IP deduplication (same IP within 1 hour not counted twice)
    const clientIp = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0] || 'unknown';
    const ipHash = crypto.createHash('sha256').update(clientIp).digest('hex');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const referrer = req.headers.referer || req.query.ref as string || null;
    const parsedRef = referrer?.includes('wa.me') || referrer?.includes('whatsapp') ? 'whatsapp'
      : referrer?.includes('instagram') ? 'instagram'
      : referrer?.includes('google') ? 'google'
      : referrer ? 'direct' : null;

    const recentView = await (db as any).ProfileView?.findOne({
      where: { profileId: profile.id, ipHash, createdAt: { [Op.gte]: oneHourAgo } },
    }).catch(() => null);

    if (!recentView) {
      Promise.all([
        (db as any).ProfileView?.create({ profileId: profile.id, ipHash, referrer: parsedRef }).catch(() => {}),
        db.Profile.increment('views', { where: { id: profile.id } }).catch(() => {}),
      ]);
    }

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

  getAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');

    const profile: any = await db.Profile.findOne({ where: { userId }, attributes: ['id', 'views'] });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

    const [viewsToday, viewsWeek, dailyRows] = await Promise.all([
      (db as any).ProfileView?.count({ where: { profileId: profile.id, createdAt: { [Op.gte]: todayStart } } }).catch(() => 0) ?? 0,
      (db as any).ProfileView?.count({ where: { profileId: profile.id, createdAt: { [Op.gte]: weekStart } } }).catch(() => 0) ?? 0,
      (db as any).ProfileView?.findAll({
        where: { profileId: profile.id, createdAt: { [Op.gte]: weekStart } },
        attributes: ['createdAt', 'referrer'],
      }).catch(() => []) ?? [],
    ]);

    // Build per-day counts for last 7 days
    const dailyCounts: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
      dailyCounts[d.toISOString().slice(0, 10)] = 0;
    }
    for (const row of dailyRows as any[]) {
      const day = new Date(row.createdAt).toISOString().slice(0, 10);
      if (day in dailyCounts) dailyCounts[day]++;
    }

    // Referrer breakdown
    const referrerCounts: Record<string, number> = { whatsapp: 0, instagram: 0, google: 0, direct: 0 };
    for (const row of dailyRows as any[]) {
      const r = row.referrer || 'direct';
      if (r in referrerCounts) referrerCounts[r]++;
    }

    return sendSuccess(res, 'Analytics retrieved', {
      totalViews: profile.views ?? 0,
      viewsToday,
      viewsThisWeek: viewsWeek,
      daily: Object.entries(dailyCounts).map(([date, count]) => ({ date, count })),
      referrers: referrerCounts,
    });
  });

  getStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');

    const profileRow: any = await db.Profile.findOne({
      where: { userId },
      attributes: ['id', 'views', 'avatarUrl', 'bio', 'phone', 'yearsExperience', 'services'],
    });
    if (!profileRow) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');

    const profileId = profileRow.id;
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [followersCount, followingCount, postsCount, weeklyViews] = await Promise.all([
      db.Follow.count({ where: { followingId: profileId } }),
      db.Follow.count({ where: { followerId: profileId } }),
      db.Post.count({ where: { authorId: profileId } }),
      (db as any).ProfileView?.count({ where: { profileId, createdAt: { [Op.gte]: weekStart } } }).catch(() => 0) ?? 0,
    ]);

    const p = profileRow.get({ plain: true });
    let profileScore = 0;
    if (p.avatarUrl)             profileScore += 20;
    if (p.bio)                   profileScore += 20;
    if (p.phone)                 profileScore += 15;
    if (p.yearsExperience)       profileScore += 15;
    if (p.services?.length > 0)  profileScore += 15;
    if (weeklyViews > 0)         profileScore += 15;

    return sendSuccess(res, 'Stats retrieved', {
      totalViews: p.views ?? 0,
      weeklyViews,
      followersCount,
      followingCount,
      postsCount,
      profileScore,
    });
  });

  getActivity = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');

    const profileRow: any = await db.Profile.findOne({ where: { userId }, attributes: ['id'] });
    if (!profileRow) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');

    const profileId = profileRow.id;

    const [views, follows, likes, comments] = await Promise.all([
      (db as any).ProfileView?.findAll({
        where: { profileId },
        order: [['createdAt', 'DESC']],
        limit: 10,
        attributes: ['id', 'createdAt'],
      }).catch(() => []) ?? [],

      db.Follow.findAll({
        where: { followingId: profileId },
        order: [['createdAt', 'DESC']],
        limit: 10,
        include: [{ model: db.Profile, as: 'follower', attributes: ['fullName', 'username', 'avatarUrl'] }],
      }),

      db.PostLike.findAll({
        order: [['createdAt', 'DESC']],
        limit: 10,
        include: [
          { model: db.Post, as: 'post', where: { authorId: profileId }, required: true, attributes: ['id', 'slug'] },
          { model: db.Profile, as: 'profile', attributes: ['fullName', 'username', 'avatarUrl'] },
        ],
      }),

      db.Comment.findAll({
        order: [['createdAt', 'DESC']],
        limit: 10,
        include: [
          { model: db.Post, as: 'post', where: { authorId: profileId }, required: true, attributes: ['id', 'slug'] },
          { model: db.Profile, as: 'author', attributes: ['fullName', 'username', 'avatarUrl'] },
        ],
      }),
    ]);

    const events: any[] = [
      ...(views as any[]).map((v: any) => ({ type: 'view', message: 'Someone viewed your profile', createdAt: v.createdAt })),
      ...(follows as any[]).map((f: any) => {
        const actor = f.get({ plain: true }).follower;
        return { type: 'follow', message: `${actor?.fullName ?? 'Someone'} started following you`, actor, createdAt: f.createdAt };
      }),
      ...(likes as any[]).map((l: any) => {
        const p = l.get({ plain: true });
        return { type: 'like', message: `${p.profile?.fullName ?? 'Someone'} appreciated your post`, actor: p.profile, postSlug: p.post?.slug, createdAt: l.createdAt };
      }),
      ...(comments as any[]).map((c: any) => {
        const p = c.get({ plain: true });
        return { type: 'comment', message: `${p.author?.fullName ?? 'Someone'} commented on your post`, actor: p.author, postSlug: p.post?.slug, createdAt: c.createdAt };
      }),
    ];

    events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return sendSuccess(res, 'Activity retrieved', events.slice(0, 10));
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
