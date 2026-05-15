import { Op } from 'sequelize';
import db from '../models';
import { paginate } from '../utils/helpers';

const AUTHOR_ATTRS = ['id', 'fullName', 'profession', 'location', 'avatarUrl', 'username'];

function dateThreshold(range: string | undefined): Date | null {
  if (!range || range === 'all') return null;
  const now = new Date();
  if (range === 'today') { now.setHours(0, 0, 0, 0); return now; }
  if (range === 'week')  return new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);
  if (range === 'month') return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return null;
}

export class FeedService {
  static async getFeed(opts: {
    type?:       string;
    dateRange?:  string;
    profession?: string;
    location?:   string;
    page:        number;
    limit:       number;
    profileId?:  string;
  }) {
    const { type, dateRange, profession, location, page, limit, profileId } = opts;
    const { skip, take } = paginate(page, limit);

    const where: any = {};
    if (type && type !== 'all') {
      where.postType = type.toUpperCase();
    }
    const dt = dateThreshold(dateRange);
    if (dt) where.createdAt = { [Op.gte]: dt };

    const authorWhere: any = {};
    if (profession && profession !== 'all')
      authorWhere.profession = { [Op.iLike]: `%${profession}%` };
    if (location && location.trim())
      authorWhere.location = { [Op.iLike]: `%${location.trim()}%` };
    const hasAuthorFilter = Object.keys(authorWhere).length > 0;

    const includePostLikes = profileId
      ? [{ model: db.PostLike, as: 'likes', where: { profileId }, required: false, attributes: ['id'] }]
      : [];

    const [posts, total] = await Promise.all([
      db.Post.findAll({
        where,
        offset: skip,
        limit: take,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: db.Profile,
            as: 'author',
            attributes: AUTHOR_ATTRS,
            where: hasAuthorFilter ? authorWhere : undefined,
            required: hasAuthorFilter,
          },
          ...includePostLikes,
        ],
      }),
      db.Post.count({
        where,
        distinct: true,
        col: 'id',
        include: hasAuthorFilter
          ? [{ model: db.Profile, as: 'author', where: authorWhere, required: true }]
          : [],
      }),
    ]);

    // Float followed profiles' posts to the top
    let ordered = posts;
    if (profileId && posts.length > 0) {
      const follows = await db.Follow.findAll({
        where: { followerId: profileId },
        attributes: ['followingId'],
      });
      const followingSet = new Set(follows.map((f: any) => f.followingId));
      ordered = [
        ...posts.filter((p: any) => followingSet.has(p.get('authorId'))),
        ...posts.filter((p: any) => !followingSet.has(p.get('authorId'))),
      ];
    }

    const hasMore = skip + posts.length < total;

    return {
      posts: ordered.map((post: any) => {
        const p = post.get({ plain: true });
        return {
          id: p.id,
          content: p.content,
          postType: p.postType,
          images: p.images || [],
          likesCount: p.likesCount,
          commentsCount: p.commentsCount,
          createdAt: p.createdAt,
          author: p.author,
          likedByMe: profileId ? (p.likes?.length ?? 0) > 0 : false,
        };
      }),
      hasMore,
      nextPage: hasMore ? page + 1 : null,
    };
  }
}
