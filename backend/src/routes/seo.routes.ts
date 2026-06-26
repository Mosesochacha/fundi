import { Router } from 'express';
import SeoController from '../controllers/seo.controller';

const router = Router();

router.get('/seo/worker-slugs', SeoController.workerSlugs);

export default router;
