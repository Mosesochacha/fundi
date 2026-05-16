import db from '../models';
import typesenseService from '../services/typesense.service';

async function main() {
  await typesenseService.setup();

  const posts = await (db as any).Post.findAll({
    where: { status: 'PUBLISHED' },
    include: [{ model: (db as any).Profile, as: 'author', attributes: ['profession', 'location', 'fullName'] }],
  });

  console.log(`Indexing ${posts.length} posts...`);
  for (const post of posts) {
    const p = post.get({ plain: true });
    await typesenseService.upsertPost({
      id:         p.id,
      content:    p.content,
      postType:   p.postType,
      authorId:   p.authorId,
      authorName: p.author?.fullName ?? '',
      profession: p.author?.profession ?? '',
      location:   p.author?.location ?? '',
      images:     p.images ?? [],
      likesCount: p.likesCount ?? 0,
      status:     p.status,
      createdAt:  Math.floor(new Date(p.createdAt).getTime() / 1000),
    });
    console.log(`  indexed: ${p.id} [${p.postType}]`);
  }
  console.log('Done.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
