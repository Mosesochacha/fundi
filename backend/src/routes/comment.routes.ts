import { Router } from 'express';
import CommentController from '../controllers/comment.controller';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

router.get('/posts/:id/comments', CommentController.getComments);
router.post('/posts/:id/comments', verifyJWT, CommentController.addComment);

export default router;
