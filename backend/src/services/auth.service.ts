import argon2 from 'argon2';
import { PrismaClient, Prisma } from '@prisma/client';
import { generateAccessToken, generateRefreshToken } from '../config/jwt.config';
import type { RegisterInput, LoginInput } from '../validators/auth.validator';

const prisma = new PrismaClient();

/**
 * Hash password using argon2
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

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw {
      code: 'EMAIL_ALREADY_EXISTS',
      message: 'An account with this email already exists',
    };
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user with GDPR consent
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

  // Find user by email
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
    throw {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    };
  }

  if (user.deletedAt) {
    throw {
      code: 'ACCOUNT_DELETED',
      message: 'This account has been deleted',
    };
  }

  // Verify password
  const isPasswordValid = await verifyPassword(user.passwordHash, password);

  if (!isPasswordValid) {
    throw {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    };
  }

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
  });

  const refreshTokenPlain = generateRefreshToken({
    sessionId: '', // Will be updated after session creation
  });

  // Hash refresh token for storage
  const refreshTokenHash = await hashPassword(refreshTokenPlain);

  // Create auth session
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const session = await prisma.authSession.create({
    data: {
      userId: user.id,
      refreshTokenHash,
      userAgent,
      ipAddress,
      expiresAt,
    },
  });

  // Generate proper refresh token with session ID
  const refreshToken = generateRefreshToken({
    sessionId: session.id,
  });

  // Return user data and tokens
  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      isEmailVerified: user.isEmailVerified,
    },
    accessToken,
    refreshToken,
  };
};

/**
 * Refresh access token using refresh token
 */
export const refreshToken = async (refreshToken: string) => {
  try {
    // Find session by refresh token
    const session = await prisma.authSession.findFirst({
      where: {
        refreshTokenHash: await hashPassword(refreshToken),
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
      throw {
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token',
      };
    }

    if (session.user.deletedAt) {
      throw {
        code: 'ACCOUNT_DELETED',
        message: 'This account has been deleted',
      };
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: session.user.id,
      email: session.user.email,
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
  } catch (error) {
    throw {
      code: 'INVALID_REFRESH_TOKEN',
      message: 'Invalid or expired refresh token',
    };
  }
};

/**
 * Logout user (revoke session)
 */
export const logoutUser = async (refreshToken: string) => {
  const refreshTokenHash = await hashPassword(refreshToken);

  const session = await prisma.authSession.updateMany({
    where: {
      refreshTokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return session.count > 0;
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
    throw {
      code: 'USER_NOT_FOUND',
      message: 'User not found',
    };
  }

  return user;
};