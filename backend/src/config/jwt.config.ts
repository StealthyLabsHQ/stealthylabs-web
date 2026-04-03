import jwt from 'jsonwebtoken';

const accessSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
const refreshSecret = process.env.JWT_REFRESH_TOKEN_SECRET;

if (!accessSecret || !refreshSecret) {
  throw new Error('JWT_ACCESS_TOKEN_SECRET and JWT_REFRESH_TOKEN_SECRET must be set. See .env.example.');
}

// JWT Configuration
export const JWT_ACCESS_TOKEN_SECRET = accessSecret;
export const JWT_REFRESH_TOKEN_SECRET = refreshSecret;

export const JWT_ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_TOKEN_TTL || '15m';
export const JWT_REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_TOKEN_TTL || '7d';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sessionId: string;
  type: 'refresh';
}

/**
 * Generate access token
 */
export const generateAccessToken = (payload: Omit<AccessTokenPayload, 'type'>): string => {
  return jwt.sign(
    { ...payload, type: 'access' },
    JWT_ACCESS_TOKEN_SECRET,
    { expiresIn: JWT_ACCESS_TOKEN_TTL }
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: Omit<RefreshTokenPayload, 'type'>): string => {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_REFRESH_TOKEN_SECRET,
    { expiresIn: JWT_REFRESH_TOKEN_TTL }
  );
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    return jwt.verify(token, JWT_ACCESS_TOKEN_SECRET) as AccessTokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};