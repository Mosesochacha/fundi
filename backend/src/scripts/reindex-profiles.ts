import 'dotenv/config';
import typesenseService from '../services/typesense.service';
import { reindexProfiles } from '../jobs/reindex';

async function main() {
  await typesenseService.setup();
  const count = await reindexProfiles();
  console.log(`Done. Indexed ${count} profiles.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
