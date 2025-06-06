import prisma from '../config/prisma.config.js';
import { MESSAGES } from '../constants/messages.js';
import { STATUS } from '../constants/statusCodes.js';
import { sendActivationEmail, sendResetEmail } from '../utils/email.js';
import {
  generateRefreshToken,
  generateToken,
  verifyRefreshToken,
  verifyToken,
} from '../utils/jwt.js';
import { comparePassword, hashPassword } from '../utils/password.js';

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const hashed = await hashPassword(password);
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashed,
        isActive: false,
      },
    });

    const token = generateToken({ userId: newUser.id });
    await sendActivationEmail(email, token);

    return res.status(STATUS.CREATED).json({
      success: true,
      message: MESSAGES.AUTH.REGISTER_SUCCESS,
    });
  } catch (err) {
    return res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
      error: err.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
    });

    if (!user) {
      return res.status(STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.AUTH.INVALID_CREDENTIALS,
      });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.AUTH.INVALID_CREDENTIALS,
      });
    }

    if (!user.isActive) {
      try {
        const token = generateToken({ userId: user.id });
        await sendActivationEmail(user.email, token);

        return res.status(STATUS.FORBIDDEN).json({
          success: false,
          message: MESSAGES.AUTH.ACCOUNT_NOT_ACTIVATED,
          needsActivation: true,
          data: {
            message: MESSAGES.AUTH.NEW_ACTIVATION_LINK_SENT,
            email: user.email,
          },
        });
      } catch (emailError) {
        return res.status(STATUS.SERVER_ERROR).json({
          success: false,
          message: MESSAGES.COMMON.SERVER_ERROR,
          error: emailError.message,
        });
      }
    }

    const token = generateToken({ userId: user.id });
    const refresh = generateRefreshToken({ userId: user.id });

    // Send token as HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true on production with HTTPS
      sameSite: 'Lax',
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie('refreshToken', refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.AUTH.LOGIN_SUCCESS,
      data: {
        // token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
        },
      },
    });
  } catch (err) {
    return res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
      error: err.message,
    });
  }
};

export const activateAccount = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.ACTIVATION.MISSING_ACTIVATION_TOKEN,
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.ACTIVATION.INVALID_OR_EXPIRED_ACTIVATION_TOKEN,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ACTIVATION.USER_NOT_FOUND,
      });
    }

    if (user.isActive) {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.ACTIVATION.ACCOUNT_ALREADY_ACTIVATED,
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: true },
    });

    return res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.ACTIVATION.ACCOUNT_SUCCESSFULLY_ACTIVATED,
    });
  } catch (err) {
    return res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
      error: err.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.FORGOT_PASSWORD.EMAIL_REQUIRED,
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(STATUS.OK).json({
        // Do not leak existence
        success: true,
        message: MESSAGES.FORGOT_PASSWORD.LINK_ALREADY_SENT,
      });
    }

    const token = generateToken({ userId: user.id }, '15m');
    await sendResetEmail(email, token);

    return res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.FORGOT_PASSWORD.RESET_LINK_SENT,
    });
  } catch (err) {
    return res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
      error: err.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.TOKEN.TOKEN_AND_NEW_PASSWORD_REQUIRED,
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.TOKEN.INVALID_OR_EXPIRED_RESET_TOKEN,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ACTIVATION.USER_NOT_FOUND,
      });
    }

    const hashed = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    return res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.FORGOT_PASSWORD.PASSWORD_UPDATE_SUCCESS,
    });
  } catch (err) {
    return res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
      error: err.message,
    });
  }
};

export const refreshAccessToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res
      .status(STATUS.UNAUTHORIZED)
      .json({ success: false, message: MESSAGES.TOKEN.MISSING_REFRESH_TOKEN });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const newAccessToken = generateToken({ userId: decoded.userId }, '15m');

    res.cookie('token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 15 * 60 * 1000,
    });

    return res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.TOKEN.TOKEN_REFRESHED_SUCCESS,
    });
  } catch {
    return res
      .status(STATUS.UNAUTHORIZED)
      .json({ success: false, message: MESSAGES.TOKEN.INVALID_REFRESH_TOKEN });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
  });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
  });

  return res.status(STATUS.OK).json({ success: true, message: MESSAGES.AUTH.LOGOUT_SUCCESS });
};

export const getCurrentUser = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, username: true, email: true, bio: true, avatarUrl: true },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  return res.status(200).json({ success: true, user });
};
