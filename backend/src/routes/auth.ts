import { Router, Request, Response } from 'express';
import { createUser, findUserByGoogleId, getUserSettings, upsertUserSettings } from '../db';
import { verifyGoogleToken, generateToken, requireAuth } from '../middleware/auth';

const router = Router();

// POST /api/auth/google - Verify Google token and create/get user
router.post('/google', async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({ error: 'Google ID token is required' });
      return;
    }

    // Verify the Google token
    const googleUser = await verifyGoogleToken(idToken);
    if (!googleUser) {
      res.status(401).json({ error: 'Invalid Google token' });
      return;
    }

    // Create or update user in database
    const user = await createUser(
      googleUser.googleId,
      googleUser.email,
      googleUser.name,
      googleUser.picture
    );

    // Generate JWT token
    const token = generateToken(user);

    // Get or create user settings
    let settings = await getUserSettings(user.id);
    if (!settings) {
      settings = await upsertUserSettings(user.id, {});
    }

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profile_image,
      },
      settings: {
        theme: settings.theme,
        language: settings.language,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const settings = await getUserSettings(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profile_image,
      },
      settings: settings
        ? {
            theme: settings.theme,
            language: settings.language,
          }
        : null,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// POST /api/auth/logout - Logout (just for API completeness, JWT is stateless)
router.post('/logout', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  // JWT is stateless, so we just return success
  // Client should delete the token
  res.json({ message: 'Logged out successfully' });
});

export default router;
