import { Router } from 'express';
import PostController from '../controllers/post.controller';
import verifyJWT from '../middleware/verifyJWT';
import optionalAuth from '../middleware/optionalAuth';
import { postCreationRateLimit } from '../middleware/rateLimiter';

const router = Router();

router.post('/posts', verifyJWT, postCreationRateLimit, PostController.createPost);
router.get('/posts/scheduled', verifyJWT, PostController.getScheduledPosts);
router.get('/posts/by-slug/:slug', optionalAuth, PostController.getPostBySlug);
router.get('/posts/:id', optionalAuth, PostController.getPost);
router.delete('/posts/:id', verifyJWT, PostController.deletePost);
router.patch('/posts/:id/schedule', verifyJWT, PostController.reschedulePost);
router.delete('/posts/:id/schedule', verifyJWT, PostController.cancelScheduledPost);

export default router;
