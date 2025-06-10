import express from 'express';
import { getHomeFeed, getUserFeed } from '../controllers/feed.controller.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/home-feed', requireAuth, getHomeFeed);
router.get('/user-feed', requireAuth, getUserFeed);

export default router;
