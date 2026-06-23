import db from '../models';
import typesenseService from '../services/typesense.service';
import logger from '../utils/logger';

/**
 * Full DB -> Typesense reindex helpers. This is the single source of truth for
 * how Profile/Post rows map into Typesense documents. Per-document upserts in
 * the controllers (profile/post) and the scheduled-posts cron keep the index in
 * sync during normal operation; these helpers backfill a fresh/empty index and
 * correct any drift. createdAt is stored in milliseconds everywhere.
 */

export async function reindexProfiles(): Promise<number> {
  const profiles = await db.Profile.findAll();

  for (const profile of profiles) {
    const p = profile.get({ plain: true });
    await typesenseService.upsertProfile({
      id:           p.id,
      fullName:     p.fullName,
      username:     p.username,
      profession:   p.profession,
      location:     p.location,
      bio:          p.bio       || '',
      services:     p.services  || [],
      avatarUrl:    p.avatarUrl || '',
      theme:        p.theme     || '',
      profileViews: p.views     || 0,
      isPublished:  true,
      createdAt:    new Date(p.createdAt).getTime(),
    });
  }

  logger.info(`Typesense reindex: ${profiles.length} profiles`);
  return profiles.length;
}

export async function reindexPosts(): Promise<number> {
  const posts = await db.Post.findAll({
    where: { status: 'PUBLISHED' },
    include: [{ model: db.Profile, as: 'author', attributes: ['fullName', 'profession', 'location'] }],
  });

  for (const post of posts) {
    const p: any = post.get({ plain: true });
    await typesenseService.upsertPost({
      id:         p.id,
      content:    p.content,
      postType:   p.postType,
      authorId:   p.authorId,
      authorName: p.author?.fullName   || '',
      profession: p.author?.profession || '',
      location:   p.author?.location   || '',
      images:     p.images             || [],
      likesCount: p.likesCount         || 0,
      status:     p.status,
      createdAt:  new Date(p.createdAt).getTime(),
    });
  }

  logger.info(`Typesense reindex: ${posts.length} posts`);
  return posts.length;
}

/** Reindex both collections. Never throws — logs and continues. */
export async function reindexAll(): Promise<void> {
  if (!typesenseService.isAvailable()) {
    logger.info('Typesense unavailable — skipping reindex');
    return;
  }
  try {
    const profiles = await reindexProfiles();
    const posts = await reindexPosts();
    logger.info(`Typesense reindex complete: ${profiles} profiles, ${posts} posts`);
  } catch (e) {
    logger.warn('Typesense reindex failed', { error: e });
  }
}

/**
 * Backfill only the collections that are currently empty. Cheap to call on
 * every boot: a populated index is a no-op, so nodemon restarts don't thrash,
 * but a fresh Typesense volume gets seeded automatically.
 */
export async function reindexIfEmpty(): Promise<void> {
  if (!typesenseService.isAvailable()) {
    logger.info('Typesense unavailable — skipping startup reindex');
    return;
  }
  try {
    const [profiles, posts] = await Promise.all([
      typesenseService.documentCount('profiles'),
      typesenseService.documentCount('posts'),
    ]);

    if (profiles === 0) {
      logger.info('Typesense profiles collection empty — backfilling');
      await reindexProfiles();
    }
    if (posts === 0) {
      logger.info('Typesense posts collection empty — backfilling');
      await reindexPosts();
    }
  } catch (e) {
    logger.warn('Typesense reindexIfEmpty failed', { error: e });
  }
}
