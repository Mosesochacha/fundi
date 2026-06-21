import db from '../models';
import typesenseService from '../services/typesense.service';

async function main() {
  await typesenseService.setup();

  const profiles = await (db as any).Profile.findAll();

  console.log(`Indexing ${profiles.length} profiles...`);
  for (const profile of profiles) {
    const p = profile.get({ plain: true });
    await typesenseService.upsertProfile({
      id:           p.id,
      fullName:     p.fullName,
      username:     p.username,
      profession:   p.profession,
      location:     p.location,
      bio:          p.bio          || '',
      services:     p.services     || [],
      avatarUrl:    p.avatarUrl    || '',
      theme:        p.theme        || '',
      profileViews: p.views        || 0,
      isPublished:  true,
      createdAt:    new Date(p.createdAt).getTime(),
    });
    console.log(`  indexed: ${p.id} [@${p.username}]`);
  }
  console.log('Done.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
