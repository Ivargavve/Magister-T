import { Router, Request, Response } from 'express';
import { updateUser, getUserSettings, upsertUserSettings, query } from '../db';
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

// DELETE /api/users/me - Delete user account and all data
router.delete('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    // Delete in order due to foreign key constraints:
    // 1. Delete all messages from user's chats
    await query('DELETE FROM messages WHERE chat_id IN (SELECT id FROM chats WHERE user_id = $1)', [userId]);

    // 2. Delete all user's chats
    await query('DELETE FROM chats WHERE user_id = $1', [userId]);

    // 3. Delete user settings
    await query('DELETE FROM user_settings WHERE user_id = $1', [userId]);

    // 4. Delete the user
    await query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
