import prisma from '../config/prisma.config.js';
import { MESSAGES } from '../constants/messages.js';
import { REGEX } from '../constants/regex.js';
import { STATUS } from '../constants/statusCodes.js';

export const validateRegisterInput = async (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(STATUS.BAD_REQUEST).json({
      success: false,
      message: MESSAGES.INPUT.INPUT_FIELDS_ARE_REQUIRED_REGISTER,
    });
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
