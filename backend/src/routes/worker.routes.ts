import { Router } from 'express';
import WorkerController from '../controllers/worker.controller';
import WorkerSettingsController from '../controllers/workerSettings.controller';
import WorkerRequestsController from '../controllers/workerRequests.controller';
import WorkerDashboardController from '../controllers/workerDashboard.controller';
import WorkerReviewsController from '../controllers/workerReviews.controller';
import verifyJWT, { optionalVerifyJWT } from '../middleware/verifyJWT';
import { uploadAvatar, uploadWork } from '../middleware/upload';

const router = Router();

// Public worker directory (browse page) — no auth required.
router.get('/browse/workers', WorkerController.browseWorkers);

// Authenticated own-profile read — MUST be registered before the public
// `/worker/:id/profile` route so "me" isn't captured as an :id.
router.get('/worker/me/profile', verifyJWT, WorkerController.getMyProfile);

// Dashboard home aggregate.
router.get('/worker/dashboard', verifyJWT, WorkerDashboardController.getDashboard);

// Reviews page aggregate.
router.get('/worker/reviews', verifyJWT, WorkerReviewsController.getReviews);

// Public worker profile — by profile id or username. Optional auth: anonymous
// viewers (incl. crawlers) get a minimal SEO payload, signed-in viewers get the
// full profile.
router.get('/worker/:id/profile', optionalVerifyJWT, WorkerController.getProfile);

// Authenticated mutations on the signed-in worker's own profile.
router.patch('/worker/profile/about', verifyJWT, WorkerController.updateAbout);
router.patch('/worker/profile/services', verifyJWT, WorkerController.updateServices);
router.patch('/worker/profile/rate', verifyJWT, WorkerController.updateRate);
router.patch('/worker/profile/service-area', verifyJWT, WorkerController.updateServiceArea);

router.post('/worker/profile/photos/upload', verifyJWT, uploadWork, WorkerController.uploadWorkPhoto);
router.post('/worker/profile/photos', verifyJWT, WorkerController.addPhoto);
router.delete('/worker/profile/photos/:photoId', verifyJWT, WorkerController.deletePhoto);

router.post('/worker/profile/experience', verifyJWT, WorkerController.addExperience);
router.patch('/worker/profile/experience/:id', verifyJWT, WorkerController.updateExperience);
router.delete('/worker/profile/experience/:id', verifyJWT, WorkerController.deleteExperience);

router.post('/worker/profile/certifications', verifyJWT, WorkerController.addCertification);
router.delete('/worker/profile/certifications/:id', verifyJWT, WorkerController.deleteCertification);

router.post('/worker/profile/education', verifyJWT, WorkerController.addEducation);
router.delete('/worker/profile/education/:id', verifyJWT, WorkerController.deleteEducation);

router.patch('/worker/availability', verifyJWT, WorkerController.updateAvailability);

// ── Job requests page (/worker/requests) ────────────────────────────────────
// `stats` is registered before the `/:id/*` action routes so it isn't shadowed.
router.get('/worker/requests/stats', verifyJWT, WorkerRequestsController.getStats);
router.get('/worker/requests', verifyJWT, WorkerRequestsController.getRequests);
router.patch('/worker/requests/:id/accept', verifyJWT, WorkerRequestsController.acceptRequest);
router.patch('/worker/requests/:id/decline', verifyJWT, WorkerRequestsController.declineRequest);
router.patch('/worker/requests/:id/complete', verifyJWT, WorkerRequestsController.completeRequest);

// ── Settings page (/worker/settings) ────────────────────────────────────────
router.get('/worker/settings', verifyJWT, WorkerSettingsController.getSettings);

router.patch('/worker/profile', verifyJWT, WorkerSettingsController.updateProfile);
router.patch('/worker/profile/avatar', verifyJWT, uploadAvatar, WorkerSettingsController.uploadAvatar);
router.delete('/worker/profile/avatar', verifyJWT, WorkerSettingsController.deleteAvatar);

router.patch('/worker/account/email', verifyJWT, WorkerSettingsController.updateEmail);
router.post('/worker/account/email/verify', verifyJWT, WorkerSettingsController.verifyEmail);
router.patch('/worker/account/phone', verifyJWT, WorkerSettingsController.updatePhone);
router.post('/worker/account/phone/verify', verifyJWT, WorkerSettingsController.verifyPhone);
router.patch('/worker/account/password', verifyJWT, WorkerSettingsController.updatePassword);
router.post('/worker/account/google/disconnect', verifyJWT, WorkerSettingsController.disconnectGoogle);

router.patch('/worker/notifications', verifyJWT, WorkerSettingsController.updateNotifications);
router.patch('/worker/privacy', verifyJWT, WorkerSettingsController.updatePrivacy);

router.patch('/worker/account/pause', verifyJWT, WorkerSettingsController.pauseAccount);
router.post('/worker/account/export', verifyJWT, WorkerSettingsController.exportData);
router.delete('/worker/account', verifyJWT, WorkerSettingsController.deleteAccount);

export default router;
