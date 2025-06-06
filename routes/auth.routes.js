import express from 'express';
import {
  activateAccount,
  forgotPassword,
  getCurrentUser,
  login,
  logout,
  refreshAccessToken,
  register,
  resetPassword,
} from '../controllers/auth.controller.js';
import {
  validateLoginInput,
  validateRegisterInput,
  validateResetPasswordInput,
} from '../middlewares/validateInput.js';
import { verifyProfileToken } from '../utils/jwt.js';

const router = express.Router();

router.post('/register', validateRegisterInput, register);
router.post('/login', validateLoginInput, login);
router.get('/me', verifyProfileToken, getCurrentUser);
router.get('/activate/:token', activateAccount);
router.post('/refresh', refreshAccessToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', validateResetPasswordInput, resetPassword);
router.post('/logout', logout);

export default router;
