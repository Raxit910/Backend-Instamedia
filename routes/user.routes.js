import express from 'express';
import { upload } from '../config/cloudinary.config.js';
import {
  getFollowers,
  getFollowing,
  getUserPreviewById,
  getUserProfile,
  searchUsers,
  toggleFollowUser,
  updateUserProfile,
  uploadAvatar,
} from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { validateProfileUpdate } from '../middlewares/validateInput.js';
import { verifyToken } from '../utils/jwt.js';

const router = express.Router();

// Optional auth for profile viewing (to show follow status)
const optionalAuth = (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = verifyToken(token);
      req.user = { id: decoded.userId };
    } catch {
      // Token invalid, but continue without auth
    }
  }
  next();
};

router.get('/profile/:username', optionalAuth, getUserProfile);
router.put('/profile', requireAuth, validateProfileUpdate, updateUserProfile);
router.post('/avatar', requireAuth, upload.single('avatar'), uploadAvatar);
router.post('/follow/:targetUserId', requireAuth, toggleFollowUser);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);
router.get('/search', optionalAuth, searchUsers);
router.get('/preview/:username', optionalAuth, getUserPreviewById);

export default router;
