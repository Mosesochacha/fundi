import db from '../models';
import typesenseService from './typesense.service';

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

    if (ids.length === 0) return { posts: [], hasMore: false, nextPage: null };

    const includePostLikes = profileId
      ? [{ model: db.PostLike, as: 'likes', where: { profileId }, required: false, attributes: ['id'] }]
      : [];

    const rows: any[] = await db.Post.findAll({
      where: { id: ids },
      include: [
        { model: db.Profile, as: 'author', attributes: AUTHOR_ATTRS },
        ...includePostLikes,
      ],
    });

    // Preserve Typesense sort order
    const byId: Record<string, any> = Object.fromEntries(rows.map((r: any) => [r.id, r]));
    let ordered: any[] = ids.map((id) => byId[id]).filter(Boolean);

    // Float followed profiles' posts to the top
    if (profileId && ordered.length > 0) {
      const follows = await db.Follow.findAll({
        where: { followerId: profileId },
        attributes: ['followingId'],
      });
      const followingSet = new Set(follows.map((f: any) => f.followingId));
      ordered = [
        ...ordered.filter((p: any) => followingSet.has(p.get('authorId'))),
        ...ordered.filter((p: any) => !followingSet.has(p.get('authorId'))),
      ];
    }

    const hasMore = page * limit < total;

    return {
      posts: ordered.map((post: any) => {
        const p = post.get({ plain: true });
        return {
          id:            p.id,
          content:       p.content,
          postType:      p.postType,
          images:        p.images        || [],
          likesCount:    p.likesCount,
          commentsCount: p.commentsCount,
          createdAt:     p.createdAt,
          author:        p.author,
          likedByMe:     profileId ? (p.likes?.length ?? 0) > 0 : false,
        };
      }),
      hasMore,
      nextPage: hasMore ? page + 1 : null,
    };
  }
}
