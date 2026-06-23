import { Router } from 'express';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import feedRoutes from './feed.routes';
import postRoutes from './post.routes';
import likeRoutes from './like.routes';
import commentRoutes from './comment.routes';
import followRoutes from './follow.routes';
import aiRoutes from './ai.routes';
import aiPublicRoutes from './aiPublic.routes';
import generateRoutes from './generate.routes';
import settingsRoutes from './settings.routes';
import sessionsRoutes from './sessions.routes';
import photosRoutes from './photos.routes';
import messagesRoutes from './messages.routes';
import jobsRoutes from './jobs.routes';
import searchRoutes from './search.routes';
import workerRoutes from './worker.routes';
import employerRoutes from './employer.routes';
import onboardingRoutes from './onboarding.routes';
import verifyJWT from '../middleware/verifyJWT';
import { csrfProtection } from '../middleware/csrfProtection';

const router = Router();

// Mutating requests: CSRF when JWT is sent via cookie (lot_a1); skipped for Bearer-only clients.
router.use(csrfProtection);

router.use(authRoutes);
router.use(profileRoutes);
router.use(feedRoutes);
router.use(postRoutes);
router.use(commentRoutes);
router.use(searchRoutes);
// Worker profile — has its own per-route verifyJWT (public GET + auth'd mutations).
router.use(workerRoutes);
// Employer dashboard — per-route verifyJWT.
router.use(employerRoutes);
// Onboarding completion (worker/employer) — per-route verifyJWT.
router.use(onboardingRoutes);
// Public "Ask AI" helper for /browse (rate-limited inside the router).
router.use(aiPublicRoutes);

// Routes below require JWT (verifyJWT is not duplicated on individual sub-routers).
router.use(verifyJWT);
router.use(likeRoutes);
router.use(followRoutes);
router.use(aiRoutes);
router.use(generateRoutes);
router.use(settingsRoutes);
router.use(sessionsRoutes);
router.use(photosRoutes);
router.use(messagesRoutes);
router.use(jobsRoutes);

export default router;
