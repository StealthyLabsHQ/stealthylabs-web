import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/jwt.config';

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verifyAccessToken(token);

    if (decoded.type !== 'access') {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token type',
        },
      });
      return;
    }

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
  }
};
