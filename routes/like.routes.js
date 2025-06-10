import express from 'express';
import { toggleLike, getPostLikes } from '../controllers/like.controller.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/:postId', requireAuth, toggleLike);
router.get('/:postId', requireAuth, getPostLikes);

export default router;
