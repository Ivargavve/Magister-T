import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  getChatsForUser,
  getChatById,
  createChat,
  updateChatTitle,
  deleteChat,
  getMessagesForChat,
  addMessage,
} from '../db';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { getSystemPrompt } from '../lib/prompt';

const router = Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// GET /api/chats - Get all chats for authenticated user
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const chats = await getChatsForUser(userId);

    res.json({
      chats: chats.map((chat) => ({
        id: chat.id,
        title: chat.title,
        createdAt: chat.created_at,
        updatedAt: chat.updated_at,
      })),
    });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

// POST /api/chats - Create new chat
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { title } = req.body;

    const chat = await createChat(userId, title);

    res.status(201).json({
      id: chat.id,
      title: chat.title,
      createdAt: chat.created_at,
      updatedAt: chat.updated_at,
    });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// GET /api/chats/:id - Get specific chat with messages
router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const chatId = parseInt(req.params.id, 10);

    if (isNaN(chatId)) {
      res.status(400).json({ error: 'Invalid chat ID' });
      return;
    }

    const chat = await getChatById(chatId, userId);
    if (!chat) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }

    const messages = await getMessagesForChat(chatId);

    res.json({
      id: chat.id,
      title: chat.title,
      createdAt: chat.created_at,
      updatedAt: chat.updated_at,
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.created_at,
      })),
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Failed to get chat' });
  }
});

// PUT /api/chats/:id - Update chat title
router.put('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const chatId = parseInt(req.params.id, 10);
    const { title } = req.body;

    if (isNaN(chatId)) {
      res.status(400).json({ error: 'Invalid chat ID' });
      return;
    }

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const chat = await updateChatTitle(chatId, userId, title);
    if (!chat) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }

    res.json({
      id: chat.id,
      title: chat.title,
      createdAt: chat.created_at,
      updatedAt: chat.updated_at,
    });
  } catch (error) {
    console.error('Update chat error:', error);
    res.status(500).json({ error: 'Failed to update chat' });
  }
});

// DELETE /api/chats/:id - Delete a chat
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const chatId = parseInt(req.params.id, 10);

    if (isNaN(chatId)) {
      res.status(400).json({ error: 'Invalid chat ID' });
      return;
    }

    const deleted = await deleteChat(chatId, userId);
    if (!deleted) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

// POST /api/chats/:id/messages - Add message to chat and get AI response
router.post('/:id/messages', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const chatId = parseInt(req.params.id, 10);
    const { content, role = 'user' } = req.body;

    if (isNaN(chatId)) {
      res.status(400).json({ error: 'Invalid chat ID' });
      return;
    }

    if (!content) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    // Verify chat belongs to user
    const chat = await getChatById(chatId, userId);
    if (!chat) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }

    // Add user message
    const userMessage = await addMessage(chatId, 'user', content);

    // Get chat history for context
    const messages = await getMessagesForChat(chatId);

    // Generate AI response
    const systemPrompt = await getSystemPrompt();
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
    });

    // Build conversation history for Gemini
    const chatHistory = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const geminiChat = model.startChat({
      history: chatHistory as any,
    });

    const result = await geminiChat.sendMessage(content);
    const response = result.response;
    const aiResponseText = response.text();

    // Save AI response
    const assistantMessage = await addMessage(chatId, 'assistant', aiResponseText);

    // Auto-generate title if this is the first message
    if (messages.length <= 1 && chat.title === 'Ny konversation') {
      // Generate a short title based on the first message
      const titleModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      try {
        const titleResult = await titleModel.generateContent(
          `Skapa en kort titel (max 5 ord, på svenska) för en konversation som börjar med denna fråga: "${content}". Svara ENDAST med titeln, inget annat.`
        );
        const newTitle = titleResult.response.text().trim().slice(0, 100);
        await updateChatTitle(chatId, userId, newTitle);
      } catch (titleError) {
        console.error('Failed to generate title:', titleError);
        // Keep default title if generation fails
      }
    }

    res.json({
      userMessage: {
        id: userMessage.id,
        role: userMessage.role,
        content: userMessage.content,
        createdAt: userMessage.created_at,
      },
      assistantMessage: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        createdAt: assistantMessage.created_at,
      },
    });
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// POST /api/chats/:id/messages/stream - Stream AI response
router.post('/:id/messages/stream', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const chatId = parseInt(req.params.id, 10);
    const { content } = req.body;

    if (isNaN(chatId)) {
      res.status(400).json({ error: 'Invalid chat ID' });
      return;
    }

    if (!content) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    // Verify chat belongs to user
    const chat = await getChatById(chatId, userId);
    if (!chat) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }

    // Add user message
    await addMessage(chatId, 'user', content);

    // Get chat history for context
    const messages = await getMessagesForChat(chatId);

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Generate AI response with streaming
    const systemPrompt = await getSystemPrompt();
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
    });

    const chatHistory = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const geminiChat = model.startChat({
      history: chatHistory as any,
    });

    const result = await geminiChat.sendMessageStream(content);

    let fullResponse = '';

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;

      // Send SSE event
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunkText })}\n\n`);
    }

    // Save complete AI response
    const assistantMessage = await addMessage(chatId, 'assistant', fullResponse);

    // Send completion event
    res.write(
      `data: ${JSON.stringify({
        type: 'done',
        messageId: assistantMessage.id,
        createdAt: assistantMessage.created_at,
      })}\n\n`
    );

    // Auto-generate title if this is the first message
    if (messages.length <= 1 && chat.title === 'Ny konversation') {
      const titleModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      try {
        const titleResult = await titleModel.generateContent(
          `Skapa en kort titel (max 5 ord, på svenska) för en konversation som börjar med denna fråga: "${content}". Svara ENDAST med titeln, inget annat.`
        );
        const newTitle = titleResult.response.text().trim().slice(0, 100);
        await updateChatTitle(chatId, userId, newTitle);
        res.write(`data: ${JSON.stringify({ type: 'title', title: newTitle })}\n\n`);
      } catch (titleError) {
        console.error('Failed to generate title:', titleError);
      }
    }

    res.end();
  } catch (error) {
    console.error('Stream message error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: 'Failed to process message' })}\n\n`);
    res.end();
  }
});

// POST /api/chat - Anonymous chat (no persistence, for unauthenticated users)
router.post('/anonymous', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    const systemPrompt = await getSystemPrompt();
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
    });

    // Build conversation history for Gemini
    const chatHistory = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({
      history: chatHistory as any,
    });

    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response;
    const aiResponseText = response.text();

    res.json({ response: aiResponseText });
  } catch (error) {
    console.error('Anonymous chat error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

export default router;
