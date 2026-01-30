import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { query, getAllSystemPrompts, getSystemPromptByKey, upsertSystemPrompt } from '../db'

const router = Router()

// Admin email whitelist
const ADMIN_EMAILS = [
  'ivargavelin@gmail.com',
  'markus.tangring@gmail.com',
  'markustangring@hotmail.com'
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

// Get all chats with message counts (anonymous - user_id for animal mapping)
router.get('/chats', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const chats = await query<{
      id: number
      title: string
      user_id: number
      message_count: number
      created_at: string
      updated_at: string
      first_message: string | null
    }>(
      `SELECT
        c.id,
        c.title,
        c.user_id,
        (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as message_count,
        c.created_at,
        c.updated_at,
        (SELECT content FROM messages WHERE chat_id = c.id AND role = 'user' ORDER BY created_at ASC LIMIT 1) as first_message
      FROM chats c
      ORDER BY c.updated_at DESC
      LIMIT 100`
    )

    res.json({ chats })
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

    res.json({ messages })
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// Get admin stats
router.get('/stats', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [userCount, chatCount, messageCount, messagesToday, chatsToday, avgMessagesPerChat] = await Promise.all([
      query<{ count: string }>('SELECT COUNT(*) as count FROM users'),
      query<{ count: string }>('SELECT COUNT(*) as count FROM chats'),
      query<{ count: string }>('SELECT COUNT(*) as count FROM messages'),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM messages WHERE created_at >= NOW() - INTERVAL '24 hours'`),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM chats WHERE created_at >= NOW() - INTERVAL '24 hours'`),
      query<{ avg: string }>('SELECT ROUND(AVG(msg_count)::numeric, 1) as avg FROM (SELECT COUNT(*) as msg_count FROM messages GROUP BY chat_id) sub')
    ])

    res.json({
      stats: {
        totalUsers: parseInt(userCount[0]?.count ?? '0', 10),
        totalChats: parseInt(chatCount[0]?.count ?? '0', 10),
        totalMessages: parseInt(messageCount[0]?.count ?? '0', 10),
        messagesToday: parseInt(messagesToday[0]?.count ?? '0', 10),
        chatsToday: parseInt(chatsToday[0]?.count ?? '0', 10),
        avgMessagesPerChat: parseFloat(avgMessagesPerChat[0]?.avg ?? '0') || 0
      }
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// Get all system prompts
router.get('/prompts', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const prompts = await getAllSystemPrompts()
    res.json({ prompts })
  } catch (error) {
    console.error('Error fetching prompts:', error)
    res.status(500).json({ error: 'Failed to fetch prompts' })
  }
})

// Get a specific prompt by key
router.get('/prompts/:key', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { key } = req.params
    const prompt = await getSystemPromptByKey(key)

    if (!prompt) {
      res.status(404).json({ error: 'Prompt not found' })
      return
    }

    res.json({ prompt })
  } catch (error) {
    console.error('Error fetching prompt:', error)
    res.status(500).json({ error: 'Failed to fetch prompt' })
  }
})

// Update a prompt
router.put('/prompts/:key', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { key } = req.params
    const { name, description, content } = req.body

    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'Content is required' })
      return
    }

    const prompt = await upsertSystemPrompt(
      key,
      name || key,
      description || null,
      content
    )

    res.json({ prompt })
  } catch (error) {
    console.error('Error updating prompt:', error)
    res.status(500).json({ error: 'Failed to update prompt' })
  }
})

export default router
