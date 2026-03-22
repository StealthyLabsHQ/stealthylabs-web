import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getUserById,
} from '../services/auth.service';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many login attempts, please try again later.' } },
});

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    // Validate input
    const validationResult = registerSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: validationResult.error.issues,
        },
      });
    }

    // Register user
    const user = await registerUser(validationResult.data);

    return res.status(201).json({
      message: 'User registered successfully',
      user,
    });
  } catch (error: any) {
    // Handle specific error codes
    if (error.code === 'EMAIL_ALREADY_EXISTS') {
      return res.status(409).json({
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: error.message,
        },
      });
    }

    // Handle Prisma errors
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email already exists',
        },
      });
    }

    console.error('Register error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
});

/**
 * POST /api/auth/login
 * Login user and create session
 */
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    // Validate input
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: validationResult.error.issues,
        },
      });
    }

    // Get request metadata
    const userAgent = req.get('user-agent');
    const ipAddress = req.ip || req.socket.remoteAddress || undefined;

    // Login user
    const result = await loginUser(validationResult.data, userAgent, ipAddress);

    // Set refresh token as HttpOnly cookie
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Return user and access token
    return res.status(200).json({
      message: 'Login successful',
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error: any) {
    // Handle specific error codes
    if (error.code === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: error.message,
        },
      });
    }

    if (error.code === 'ACCOUNT_DELETED') {
      return res.status(401).json({
        error: {
          code: 'ACCOUNT_DELETED',
          message: error.message,
        },
      });
    }

    console.error('Login error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token from cookie
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshTokenCookie = req.cookies.refreshToken;

    if (!refreshTokenCookie) {
      return res.status(401).json({
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required',
        },
      });
    }

    const result = await refreshAccessToken(refreshTokenCookie);

    return res.status(200).json({
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error: any) {
    // Handle specific error codes
    if (error.code === 'INVALID_REFRESH_TOKEN' || error.code === 'ACCOUNT_DELETED') {
      // Clear invalid refresh token cookie
      const isProduction = process.env.NODE_ENV === 'production';

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        path: '/',
      });

      return res.status(401).json({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    console.error('Refresh token error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user and revoke session
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const refreshTokenCookie = req.cookies.refreshToken;

    if (refreshTokenCookie) {
      await logoutUser(refreshTokenCookie);
    }

    // Clear refresh token cookie
    const isProduction = process.env.NODE_ENV === 'production';

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
    });

    return res.status(200).json({
      message: 'Logout successful',
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    // Still return success even if logout fails
    return res.status(200).json({
      message: 'Logout successful',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user information (requires authentication)
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    // This endpoint requires authentication middleware
    // For now, return 401 - will be implemented with auth middleware
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
});

export default router;