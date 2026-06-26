import { Router } from 'express';
import SeoController from '../controllers/seo.controller';

const router = Router();

// Public — consumed by the Next.js sitemap builder.
router.get('/seo/worker-slugs', SeoController.workerSlugs);

export default router;
