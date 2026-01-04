import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { findUserByGoogleId, User } from '../db';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: number;
    }
  }
}

export interface JWTPayload {
  userId: number;
  googleId: string;
  email: string;
  iat: number;
  exp: number;
}

// Generate JWT token for authenticated user
export function generateToken(user: User): string {
  const payload = {
    userId: user.id,
    googleId: user.google_id,
    email: user.email,
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  });
}

// Verify Google ID token
export async function verifyGoogleToken(idToken: string): Promise<{
  googleId: string;
  email: string;
  name: string;
  picture: string | null;
} | null> {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) return null;

    return {
      googleId: payload.sub,
      email: payload.email!,
      name: payload.name || payload.email!,
      picture: payload.picture || null,
    };
  } catch (error) {
    console.error('Error verifying Google token:', error);
    return null;
  }
}

// Middleware to require authentication via JWT
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'Authorization header required' });
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      res.status(401).json({ error: 'Token required' });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Find user in database
    const user = await findUserByGoogleId(decoded.googleId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
}

// Optional authentication - doesn't fail if no token provided
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    const user = await findUserByGoogleId(decoded.googleId);

    if (user) {
      req.user = user;
      req.userId = user.id;
    }

    next();
  } catch {
    // Token invalid but that's okay for optional auth
    next();
  }
}
