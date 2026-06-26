import { Op } from 'sequelize';
import db from '../models';
import typesenseService from './typesense.service';
import { generateSlug } from '../utils/slugify';

const AUTHOR_ATTRS = ['id', 'fullName', 'profession', 'location', 'avatarUrl', 'username'];

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
    const { type, profession, location, page, limit, profileId } = opts;

    const { ids, total } = await typesenseService.getFeed({
      type, page, limit, profession, location,
    });

    const includePostLikes = profileId
      ? [{ model: db.PostLike, as: 'likes', where: { profileId }, required: false, attributes: ['id'] }]
      : [];

    let rows: any[];
    let hasMore: boolean;

    if (ids.length > 0) {
      rows = await db.Post.findAll({
        where: { id: ids },
        include: [
          { model: db.Profile, as: 'author', attributes: AUTHOR_ATTRS },
          ...includePostLikes,
        ],
      });

      const byId: Record<string, any> = Object.fromEntries(rows.map((r: any) => [r.id, r]));
      rows = ids.map((id) => byId[id]).filter(Boolean);
      hasMore = page * limit < total;
    } else {
      const where: Record<string, any> = { status: 'PUBLISHED' };
      if (type && type !== 'all') where.postType = type.toUpperCase();
      if (profession && profession !== 'all') where['$author.profession$'] = profession;
      if (location?.trim()) where['$author.location$'] = { [Op.iLike]: `%${location.trim()}%` };

      const { count, rows: dbRows } = await (db.Post as any).findAndCountAll({
        where,
        include: [
          { model: db.Profile, as: 'author', attributes: AUTHOR_ATTRS },
          ...includePostLikes,
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset: (page - 1) * limit,
        subQuery: false,
      });

      rows = dbRows;
      hasMore = page * limit < count;
    }

    let followingSet = new Set<string>();
    if (profileId && rows.length > 0) {
      const follows = await db.Follow.findAll({
        where: { followerId: profileId },
        attributes: ['followingId'],
      });
      followingSet = new Set(follows.map((f: any) => f.followingId));
      rows = [
        ...rows.filter((p: any) => followingSet.has(p.get('authorId'))),
        ...rows.filter((p: any) => !followingSet.has(p.get('authorId'))),
      ];
    }

    return {
      posts: rows.map((post: any) => {
        const p = post.get({ plain: true });
        const slug = p.slug || generateSlug(p.content, p.id);
        return {
          id:            p.id,
          slug,
          content:       p.content,
          postType:      p.postType,
          images:        p.images        || [],
          likesCount:    p.likesCount,
          commentsCount: p.commentsCount,
          createdAt:     p.createdAt,
          author:        p.author,
          likedByMe:     profileId ? (p.likes?.length ?? 0) > 0 : false,
          followedByMe:  profileId ? followingSet.has(p.authorId) : false,
        };
      }),
      hasMore,
      nextPage: hasMore ? page + 1 : null,
    };
  }
}
