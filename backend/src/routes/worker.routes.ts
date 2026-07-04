import { Router } from 'express';
import WorkerController from '../controllers/worker.controller';
import WorkerSettingsController from '../controllers/workerSettings.controller';
import WorkerRequestsController from '../controllers/workerRequests.controller';
import WorkerDashboardController from '../controllers/workerDashboard.controller';
import WorkerReviewsController from '../controllers/workerReviews.controller';
import verifyJWT, { optionalVerifyJWT } from '../middleware/verifyJWT';
import requireAccountType from '../middleware/requireAccountType';
import { uploadAvatar, uploadWork } from '../middleware/upload';

const router = Router();

const workerOnly = [verifyJWT, requireAccountType('worker')];

router.get('/browse/workers', WorkerController.browseWorkers);

router.get('/worker/me/profile', ...workerOnly, WorkerController.getMyProfile);

router.get('/worker/dashboard', ...workerOnly, WorkerDashboardController.getDashboard);

router.get('/worker/reviews', ...workerOnly, WorkerReviewsController.getReviews);

router.get('/worker/:id/profile', optionalVerifyJWT, WorkerController.getProfile);

router.patch('/worker/profile/about', ...workerOnly, WorkerController.updateAbout);
router.patch('/worker/profile/services', ...workerOnly, WorkerController.updateServices);
router.patch('/worker/profile/rate', ...workerOnly, WorkerController.updateRate);
router.patch('/worker/profile/service-area', ...workerOnly, WorkerController.updateServiceArea);

router.post('/worker/profile/photos/upload', ...workerOnly, uploadWork, WorkerController.uploadWorkPhoto);
router.post('/worker/profile/photos', ...workerOnly, WorkerController.addPhoto);
router.delete('/worker/profile/photos/:photoId', ...workerOnly, WorkerController.deletePhoto);

router.post('/worker/profile/experience', ...workerOnly, WorkerController.addExperience);
router.patch('/worker/profile/experience/:id', ...workerOnly, WorkerController.updateExperience);
router.delete('/worker/profile/experience/:id', ...workerOnly, WorkerController.deleteExperience);

router.post('/worker/profile/certifications', ...workerOnly, WorkerController.addCertification);
router.delete('/worker/profile/certifications/:id', ...workerOnly, WorkerController.deleteCertification);

router.post('/worker/profile/education', ...workerOnly, WorkerController.addEducation);
router.delete('/worker/profile/education/:id', ...workerOnly, WorkerController.deleteEducation);

router.patch('/worker/availability', ...workerOnly, WorkerController.updateAvailability);

router.get('/worker/requests/stats', ...workerOnly, WorkerRequestsController.getStats);
router.get('/worker/requests', ...workerOnly, WorkerRequestsController.getRequests);
router.patch('/worker/requests/:id/accept', ...workerOnly, WorkerRequestsController.acceptRequest);
router.patch('/worker/requests/:id/decline', ...workerOnly, WorkerRequestsController.declineRequest);
router.patch('/worker/requests/:id/complete', ...workerOnly, WorkerRequestsController.completeRequest);

router.get('/worker/settings', ...workerOnly, WorkerSettingsController.getSettings);

router.patch('/worker/profile', ...workerOnly, WorkerSettingsController.updateProfile);
router.patch('/worker/profile/avatar', ...workerOnly, uploadAvatar, WorkerSettingsController.uploadAvatar);
router.delete('/worker/profile/avatar', ...workerOnly, WorkerSettingsController.deleteAvatar);

router.patch('/worker/account/email', ...workerOnly, WorkerSettingsController.updateEmail);
router.post('/worker/account/email/verify', ...workerOnly, WorkerSettingsController.verifyEmail);
router.post('/worker/account/email/confirm', ...workerOnly, WorkerSettingsController.confirmEmailChange);
router.patch('/worker/account/phone', ...workerOnly, WorkerSettingsController.updatePhone);
router.post('/worker/account/phone/verify', ...workerOnly, WorkerSettingsController.verifyPhone);
router.patch('/worker/account/password', ...workerOnly, WorkerSettingsController.updatePassword);
router.post('/worker/account/google/disconnect', ...workerOnly, WorkerSettingsController.disconnectGoogle);

router.patch('/worker/notifications', ...workerOnly, WorkerSettingsController.updateNotifications);
router.patch('/worker/privacy', ...workerOnly, WorkerSettingsController.updatePrivacy);

router.patch('/worker/account/pause', ...workerOnly, WorkerSettingsController.pauseAccount);
router.post('/worker/account/export', ...workerOnly, WorkerSettingsController.exportData);
router.delete('/worker/account', ...workerOnly, WorkerSettingsController.deleteAccount);

export default router;
