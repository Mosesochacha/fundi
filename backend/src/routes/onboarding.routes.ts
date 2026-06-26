import { Router } from 'express';
import OnboardingController from '../controllers/onboarding.controller';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

router.patch('/worker/onboarding', verifyJWT, OnboardingController.completeWorker);
router.patch('/employer/onboarding', verifyJWT, OnboardingController.completeEmployer);

export default router;
