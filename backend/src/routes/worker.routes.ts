import { Router } from 'express';
import WorkerController from '../controllers/worker.controller';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

// Public worker directory (browse page) — no auth required.
router.get('/browse/workers', WorkerController.browseWorkers);

// Authenticated own-profile read — MUST be registered before the public
// `/worker/:id/profile` route so "me" isn't captured as an :id.
router.get('/worker/me/profile', verifyJWT, WorkerController.getMyProfile);

// Public worker profile (employer view) — by profile id or username.
router.get('/worker/:id/profile', WorkerController.getProfile);

// Authenticated mutations on the signed-in worker's own profile.
router.patch('/worker/profile/about', verifyJWT, WorkerController.updateAbout);
router.patch('/worker/profile/services', verifyJWT, WorkerController.updateServices);
router.patch('/worker/profile/rate', verifyJWT, WorkerController.updateRate);
router.patch('/worker/profile/service-area', verifyJWT, WorkerController.updateServiceArea);

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

export default router;
