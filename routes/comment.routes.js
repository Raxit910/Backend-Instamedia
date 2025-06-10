import express from 'express';
import { addComment, deleteComment, getPostComments } from '../controllers/comment.controller.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/:postId', requireAuth, addComment);
router.delete('/:commentId', requireAuth, deleteComment);
router.get('/:postId', requireAuth, getPostComments);

export default router;
