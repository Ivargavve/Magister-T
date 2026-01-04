import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initializeDatabase } from './db';
import authRoutes from './routes/auth';
import chatsRoutes from './routes/chats';
import usersRoutes from './routes/users';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow any netlify.app subdomain
      if (origin.endsWith('.netlify.app')) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// Debug endpoint to check env vars (only shows if they exist, not values)
app.get('/debug/env', (_req: Request, res: Response) => {
  res.json({
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasFrontendUrl: !!process.env.FRONTEND_URL,
    frontendUrl: process.env.FRONTEND_URL || 'not set',
    nodeEnv: process.env.NODE_ENV || 'not set',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/users', usersRoutes);

// Legacy endpoint for anonymous chat (backwards compatibility)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const { MAGISTER_T_SYSTEM_PROMPT } = await import('./lib/prompt');

    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    console.log('Using Gemini API key (first 10 chars):', apiKey.substring(0, 10) + '...');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: MAGISTER_T_SYSTEM_PROMPT,
    });

    const chatHistory = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response;
    const aiResponseText = response.text();

    res.json({ response: aiResponseText });
  } catch (error: any) {
    console.error('Chat error:', error?.message || error);
    console.error('Full error:', JSON.stringify(error, null, 2));
    res.status(500).json({ error: 'Failed to generate response', details: error?.message });
  }
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
async function startServer() {
  try {
    // Initialize database schema
    if (process.env.DATABASE_URL) {
      await initializeDatabase();
      console.log('Database initialized');
    } else {
      console.warn('DATABASE_URL not set, running without database');
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
