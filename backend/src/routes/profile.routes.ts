import { Router } from 'express';
import ProfileController from '../controllers/profile.controller';
import SettingsController from '../controllers/settings.controller';
import optionalAuth from '../middleware/optionalAuth';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

// Must be before /profiles/:username to avoid param capture
router.get('/profiles/check-username', verifyJWT, SettingsController.checkUsername);

router.get('/profiles/:username', optionalAuth, ProfileController.getProfile);
router.get('/profiles/:username/posts', optionalAuth, ProfileController.getProfilePosts);
router.patch('/profile', verifyJWT, ProfileController.updateMyProfile);

export default router;
