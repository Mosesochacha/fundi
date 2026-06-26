import 'dotenv/config';
import typesenseService from '../services/typesense.service';
import { reindexPosts } from '../jobs/reindex';

async function main() {
  await typesenseService.setup();
  const count = await reindexPosts();
  console.log(`Done. Indexed ${count} posts.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
