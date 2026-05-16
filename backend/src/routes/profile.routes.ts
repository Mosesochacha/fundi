import { Router } from 'express';
import ProfileController from '../controllers/profile.controller';
import SettingsController from '../controllers/settings.controller';
import optionalAuth from '../middleware/optionalAuth';
import verifyJWT from '../middleware/verifyJWT';
import { profileUpdateRateLimit } from '../middleware/rateLimiter';

const router = Router();

// Must be before /profiles/:username to avoid param capture
router.get('/profiles/check-username', verifyJWT, SettingsController.checkUsername);
router.get('/profiles/browse', optionalAuth, ProfileController.browseProfiles);
router.get('/profiles/search', optionalAuth, ProfileController.searchProfiles);
router.get('/public/check-username', ProfileController.checkUsernamePublic);

router.get('/profiles/:username', optionalAuth, ProfileController.getProfile);
router.get('/profiles/:username/posts', optionalAuth, ProfileController.getProfilePosts);
router.patch('/profile', verifyJWT, profileUpdateRateLimit, ProfileController.updateMyProfile);
router.post('/profile/publish', verifyJWT, ProfileController.publishProfile);
router.get('/profile/analytics', verifyJWT, ProfileController.getAnalytics);
router.get('/profile/stats',    verifyJWT, ProfileController.getStats);
router.get('/profile/activity', verifyJWT, ProfileController.getActivity);

export default router;
