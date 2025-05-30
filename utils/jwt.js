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

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.REFRESH_SECRET);
};
