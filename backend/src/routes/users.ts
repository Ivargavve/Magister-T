import { Router, Request, Response } from 'express';
import { updateUser, getUserSettings, upsertUserSettings } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

// PUT /api/users/settings - Update user settings
router.put('/settings', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { theme, language, name, profileImage } = req.body;

    // Update user settings
    const settingsUpdate: { theme?: string; language?: string } = {};
    if (theme) settingsUpdate.theme = theme;
    if (language) settingsUpdate.language = language;

    let settings = await getUserSettings(userId);
    if (Object.keys(settingsUpdate).length > 0 || !settings) {
      settings = await upsertUserSettings(userId, settingsUpdate);
    }

    // Update user profile if provided
    if (name || profileImage !== undefined) {
      await updateUser(userId, {
        ...(name && { name }),
        ...(profileImage !== undefined && { profile_image: profileImage }),
      });
    }

    res.json({
      message: 'Settings updated successfully',
      settings: {
        theme: settings.theme,
        language: settings.language,
      },
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// GET /api/users/settings - Get user settings
router.get('/settings', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    let settings = await getUserSettings(userId);

    if (!settings) {
      settings = await upsertUserSettings(userId, {});
    }

    res.json({
      theme: settings.theme,
      language: settings.language,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

export default router;
