import jwt from 'jsonwebtoken';

export const generateToken = (payload, expiresIn = '15m') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

export const generateRefreshToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.REFRESH_SECRET, { expiresIn });
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const verifyProfileToken = (req, res, next) => {
  let token = null;

  // Check cookies first
  if (req.cookies?.token) {
    token = req.cookies.token;
  }

  // // Fallback to Authorization header
  // else if (req.headers.authorization?.startsWith('Bearer ')) {
  //   token = req.headers.authorization.split(' ')[1];
  // }

  // No token found
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized - No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId };
    next();
  } catch {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.REFRESH_SECRET);
};
