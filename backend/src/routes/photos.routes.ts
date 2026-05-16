import { Router } from 'express';
import PhotosController from '../controllers/photos.controller';
import { uploadAvatar, uploadBanner, uploadWork } from '../middleware/upload';
import { uploadRateLimit } from '../middleware/rateLimiter';

const router = Router();

router.post('/photos/avatar', uploadRateLimit, uploadAvatar, PhotosController.uploadAvatar);
router.delete('/photos/avatar', PhotosController.removeAvatar);
router.post('/photos/banner', uploadRateLimit, uploadBanner, PhotosController.uploadBanner);
router.delete('/photos/banner', PhotosController.removeBanner);
router.post('/photos/work', uploadRateLimit, uploadWork, PhotosController.uploadWorkPhoto);
router.delete('/photos/work/:index', PhotosController.removeWorkPhoto);

export default router;
