import { Router } from 'express';
import CommentController from '../controllers/comment.controller';
import verifyJWT from '../middleware/verifyJWT';
import optionalAuth from '../middleware/optionalAuth';

const router = Router();

router.get('/posts/:id/comments', optionalAuth, CommentController.getComments);
router.post('/posts/:id/comments', verifyJWT, CommentController.addComment);
router.post('/posts/:postId/comments/:commentId/like', verifyJWT, CommentController.toggleCommentLike);

export default router;
