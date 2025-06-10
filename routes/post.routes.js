import express from 'express';
import { uploadPostImages } from '../config/cloudinary.config.js';
import {
  createPost,
  getPostById,
  deletePost,
  updatePost,
  getPostsByUsername,
} from '../controllers/post.controller.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create', requireAuth, uploadPostImages.array('images', 4), createPost);
router.get('/:postId', requireAuth, getPostById);
router.get('/user/:username', requireAuth, getPostsByUsername);
router.put('/:postId', requireAuth, updatePost);
router.delete('/:postId', requireAuth, deletePost);

export default router;
