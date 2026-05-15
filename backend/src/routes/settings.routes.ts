import { Router } from 'express';
import SettingsController from '../controllers/settings.controller';

const router = Router();

router.get('/settings/notifications', SettingsController.getNotifications);
router.patch('/settings/notifications', SettingsController.updateNotifications);
router.get('/settings/privacy', SettingsController.getPrivacy);
router.patch('/settings/privacy', SettingsController.updatePrivacy);
router.get('/settings/preferences', SettingsController.getPreferences);
router.patch('/settings/preferences', SettingsController.updatePreferences);
router.get('/profiles/check-username', SettingsController.checkUsername);

export default router;
