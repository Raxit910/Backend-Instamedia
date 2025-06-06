import prisma from '../config/prisma.config.js';
import { MESSAGES } from '../constants/messages.js';
import { REGEX } from '../constants/regex.js';
import { STATUS } from '../constants/statusCodes.js';

export const validateRegisterInput = async (req, res, next) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password || !confirmPassword) {
    return res.status(STATUS.BAD_REQUEST).json({
      success: false,
      message: MESSAGES.INPUT.INPUT_FIELDS_ARE_REQUIRED_REGISTER,
    });
  }

  if (password !== confirmPassword) {
    return res.status(STATUS.BAD_REQUEST).json({ message: MESSAGES.INPUT.PASSWORD_NOT_MATCH });
  }

  if (!REGEX.USERNAME.test(username)) {
    return res.status(STATUS.BAD_REQUEST).json({
      success: false,
      message: MESSAGES.INPUT.INVALID_USERNAME_FORMAT,
    });
  }

  if (!REGEX.EMAIL.test(email)) {
    return res.status(STATUS.BAD_REQUEST).json({
      success: false,
      message: MESSAGES.INPUT.INVALID_EMAIL_FORMAT,
    });
  }

  if (!REGEX.PASSWORD.test(password)) {
    return res.status(STATUS.BAD_REQUEST).json({
      success: false,
      message: MESSAGES.INPUT.INVALID_PASSWORD_FORMAT,
    });
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });

  if (existingUser) {
    let takenFields = [];
    if (existingUser.username === username) takenFields.push('username');
    if (existingUser.email === email) takenFields.push('email');

    const message =
      takenFields.length === 2
        ? MESSAGES.INPUT.USERNAME_AND_EMAIL_TAKEN
        : takenFields[0] === 'username'
          ? MESSAGES.INPUT.USERNAME_ALREADY_TAKEN
          : MESSAGES.INPUT.EMAIL_ALREADY_TAKEN;

    return res.status(STATUS.CONFLICT).json({
      success: false,
      message,
    });
  }

  next();
};

export const validateLoginInput = (req, res, next) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    return res.status(STATUS.BAD_REQUEST).json({
      success: false,
      message: MESSAGES.INPUT.INPUT_FIELDS_ARE_REQUIRED_LOGIN,
    });
  }

  next();
};

export const validateResetPasswordInput = (req, res, next) => {
  const { password } = req.body;

  if (!REGEX.PASSWORD.test(password)) {
    return res.status(STATUS.BAD_REQUEST).json({
      success: false,
      message: MESSAGES.INPUT.INVALID_PASSWORD_FORMAT,
    });
  }

  next();
};

export const validateProfileUpdate = (req, res, next) => {
  const { username, bio } = req.body;
  const errors = [];

  // Validate username if provided
  if (username !== undefined) {
    if (typeof username !== 'string') {
      errors.push('Username must be a string');
    } else if (username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    } else if (username.length > 30) {
      errors.push('Username cannot exceed 30 characters');
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }
  }

  // Validate bio if provided
  if (bio !== undefined) {
    if (typeof bio !== 'string') {
      errors.push('Bio must be a string');
    } else if (bio.length > 500) {
      errors.push('Bio cannot exceed 500 characters');
    }
  }

  // Check if at least one field is provided
  if (username === undefined && bio === undefined) {
    errors.push('At least one field (username or bio) must be provided');
  }

  if (errors.length > 0) {
    return res.status(STATUS.BAD_REQUEST).json({
      success: false,
      message: MESSAGES.VALIDATION.VALIDATION_ERROR,
      errors,
    });
  }

  next();
};
