import { Router } from 'express';
import PostController from '../controllers/post.controller';
import verifyJWT from '../middleware/verifyJWT';
import optionalAuth from '../middleware/optionalAuth';

const router = Router();

router.post('/posts', verifyJWT, PostController.createPost);
router.get('/posts/:id', optionalAuth, PostController.getPost);
router.delete('/posts/:id', verifyJWT, PostController.deletePost);

export default router;
