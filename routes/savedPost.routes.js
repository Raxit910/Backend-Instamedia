import express from 'express';
import { toggleSavePost, getSavedPosts } from '../controllers/savedPost.controller.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/:postId', requireAuth, toggleSavePost);
router.get('/', requireAuth, getSavedPosts);

export default router;
