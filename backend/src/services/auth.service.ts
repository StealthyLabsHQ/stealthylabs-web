import argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../config/jwt.config';
import type { RegisterInput, LoginInput } from '../validators/auth.validator';

const prisma = new PrismaClient();

/**
 * Hash a token deterministically with SHA-256.
 * Produces a 64-character hex string matching the Char(64) DB column.
 * Unlike Argon2, this is a pure lookup hash – not for passwords.
 */
const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

/**
 * Hash password using argon2id
 */
export const hashPassword = async (password: string): Promise<string> => {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
};

/**
 * Verify password using argon2
 */
export const verifyPassword = async (hash: string, password: string): Promise<boolean> => {
  return argon2.verify(hash, password);
};

/**
 * Register a new user
 */
export const registerUser = async (input: RegisterInput) => {
  const { email, password, displayName } = input;

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw {
      code: 'EMAIL_ALREADY_EXISTS',
      message: 'An account with this email already exists',
    };
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName,
      gdprConsentAt: new Date(),
      gdprConsentVersion: '1.0',
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      isEmailVerified: true,
      createdAt: true,
    },
  });

  return user;
};

/**
 * Login user and create session
 */
export const loginUser = async (input: LoginInput, userAgent?: string, ipAddress?: string) => {
  const { email, password } = input;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      displayName: true,
      isEmailVerified: true,
      passwordHash: true,
      deletedAt: true,
    },
  });

  if (!user) {
    throw { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
  }

  if (user.deletedAt) {
    throw { code: 'ACCOUNT_DELETED', message: 'This account has been deleted' };
  }

  const isPasswordValid = await verifyPassword(user.passwordHash, password);

  if (!isPasswordValid) {
    throw { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
  }

  const accessToken = generateAccessToken({ userId: user.id, email: user.email });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Create session with a random placeholder hash (64 hex chars, unique, no collision risk)
  const session = await prisma.authSession.create({
    data: {
      userId: user.id,
      refreshTokenHash: randomBytes(32).toString('hex'),
      userAgent,
      ipAddress,
      expiresAt,
    },
  });

  // Generate the refresh token with the real session ID now that we have it
  const refreshTokenValue = generateRefreshToken({ sessionId: session.id });
  const tokenHash = hashToken(refreshTokenValue);

  // Update the session with the correct hash
  await prisma.authSession.update({
    where: { id: session.id },
    data: { refreshTokenHash: tokenHash },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      isEmailVerified: user.isEmailVerified,
    },
    accessToken,
    refreshToken: refreshTokenValue,
  };
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (tokenValue: string) => {
  // Verify JWT signature and expiry before touching the DB
  let payload;
  try {
    payload = verifyRefreshToken(tokenValue);
  } catch {
    throw { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' };
  }

  const tokenHash = hashToken(tokenValue);

  const session = await prisma.authSession.findFirst({
    where: {
      id: payload.sessionId,
      refreshTokenHash: tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          isEmailVerified: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!session) {
    throw { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' };
  }

  if (session.user.deletedAt) {
    throw { code: 'ACCOUNT_DELETED', message: 'This account has been deleted' };
  }

  const accessToken = generateAccessToken({
    userId: session.user.id,
    email: session.user.email,
  });

  await prisma.authSession.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
      isEmailVerified: session.user.isEmailVerified,
    },
    accessToken,
  };
};

/**
 * Logout user (revoke session)
 */
export const logoutUser = async (tokenValue: string) => {
  const tokenHash = hashToken(tokenValue);

  const result = await prisma.authSession.updateMany({
    where: { refreshTokenHash: tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return result.count > 0;
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      isEmailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw { code: 'USER_NOT_FOUND', message: 'User not found' };
  }

  return user;
};
