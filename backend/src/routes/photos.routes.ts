import { Router } from 'express';
import PhotosController from '../controllers/photos.controller';
import { uploadAvatar, uploadBanner } from '../middleware/upload';

const router = Router();

router.post('/photos/avatar', uploadAvatar, PhotosController.uploadAvatar);
router.delete('/photos/avatar', PhotosController.removeAvatar);
router.post('/photos/banner', uploadBanner, PhotosController.uploadBanner);
router.delete('/photos/banner', PhotosController.removeBanner);

export default router;
