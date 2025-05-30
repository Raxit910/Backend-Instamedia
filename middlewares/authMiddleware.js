import { MESSAGES } from '../constants/messages.js';
import { STATUS } from '../constants/statusCodes.js';
import { verifyToken } from '../utils/jwt.js';

export const requireAuth = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(STATUS.UNAUTHORIZED).json({
      success: false,
      message: MESSAGES.TOKEN.NO_TOKEN_PROVIDED,
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.userId };
    next();
  } catch {
    return res.status(STATUS.UNAUTHORIZED).json({
      success: false,
      message: MESSAGES.TOKEN.INVALID_OR_EXPIRED_TOKEN,
    });
  }
};
