import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { query } from '../db'

const router = Router()

// Admin email whitelist
const ADMIN_EMAILS = [
  'ivargavelin@gmail.com',
  'markus.tangring@gmail.com'
]

// Middleware to check if user is admin
const requireAdmin = (req: Request, res: Response, next: Function) => {
  const userEmail = req.user?.email
  if (!userEmail || !ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
    res.status(403).json({ error: 'Unauthorized - Admin access required' })
    return
  }
  next()
}

// Check if current user is admin
router.get('/check', requireAuth, (req: Request, res: Response) => {
  const userEmail = req.user?.email
  const isAdmin = userEmail ? ADMIN_EMAILS.includes(userEmail.toLowerCase()) : false
  res.json({ isAdmin })
})

// Get all chats with user info and message counts
router.get('/chats', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const chats = await query<{
      id: number
      title: string
      user_id: number
      user_email: string
      user_name: string
      message_count: number
      created_at: string
      updated_at: string
      first_message: string | null
    }>(
      `SELECT
        c.id,
        c.title,
        c.user_id,
        u.email as user_email,
        u.name as user_name,
        (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as message_count,
        c.created_at,
        c.updated_at,
        (SELECT content FROM messages WHERE chat_id = c.id AND role = 'user' ORDER BY created_at ASC LIMIT 1) as first_message
      FROM chats c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.updated_at DESC
      LIMIT 100`
    )

    res.json({ chats: chats.rows })
  } catch (error) {
    console.error('Error fetching admin chats:', error)
    res.status(500).json({ error: 'Failed to fetch chats' })
  }
})

// Get messages for a specific chat (admin view)
router.get('/chats/:chatId/messages', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params

    const messages = await query<{
      id: number
      role: string
      content: string
      created_at: string
    }>(
      `SELECT id, role, content, created_at
       FROM messages
       WHERE chat_id = $1
       ORDER BY created_at ASC`,
      [chatId]
    )

    res.json({ messages: messages.rows })
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// Get admin stats
router.get('/stats', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [userCount, chatCount, messageCount, recentActivity] = await Promise.all([
      query<{ count: string }>('SELECT COUNT(*) as count FROM users'),
      query<{ count: string }>('SELECT COUNT(*) as count FROM chats'),
      query<{ count: string }>('SELECT COUNT(*) as count FROM messages'),
      query<{ date: string; chats: string; messages: string }>(
        `SELECT
          DATE(c.created_at) as date,
          COUNT(DISTINCT c.id) as chats,
          COUNT(m.id) as messages
        FROM chats c
        LEFT JOIN messages m ON c.id = m.chat_id
        WHERE c.created_at > NOW() - INTERVAL '7 days'
        GROUP BY DATE(c.created_at)
        ORDER BY date DESC`
      )
    ])

    res.json({
      stats: {
        totalUsers: parseInt(userCount.rows[0]?.count || '0'),
        totalChats: parseInt(chatCount.rows[0]?.count || '0'),
        totalMessages: parseInt(messageCount.rows[0]?.count || '0'),
        recentActivity: recentActivity.rows
      }
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

export default router
