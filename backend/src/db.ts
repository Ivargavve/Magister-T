import { Pool, PoolClient } from 'pg';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Query helper with error handling
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 50), duration, rows: result.rowCount });
    return result.rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Get a client from the pool for transactions
export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect();
  return client;
}

// Database schema initialization
export const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(50) DEFAULT 'dark',
  language VARCHAR(10) DEFAULT 'sv',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Chats table
CREATE TABLE IF NOT EXISTS chats (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL DEFAULT 'Ny konversation',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System prompts table for AI configuration
CREATE TABLE IF NOT EXISTS system_prompts (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_system_prompts_key ON system_prompts(key);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chats_updated_at ON chats;
CREATE TRIGGER update_chats_updated_at
    BEFORE UPDATE ON chats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_prompts_updated_at ON system_prompts;
CREATE TRIGGER update_system_prompts_updated_at
    BEFORE UPDATE ON system_prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;

// Initialize database schema
export async function initializeDatabase(): Promise<void> {
  try {
    await pool.query(schema);
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
    throw error;
  }
}

// User operations
export interface User {
  id: number;
  google_id: string;
  email: string;
  name: string;
  profile_image: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function findUserByGoogleId(googleId: string): Promise<User | null> {
  const users = await query<User>(
    'SELECT * FROM users WHERE google_id = $1',
    [googleId]
  );
  return users[0] || null;
}

export async function createUser(
  googleId: string,
  email: string,
  name: string,
  profileImage: string | null
): Promise<User> {
  const users = await query<User>(
    `INSERT INTO users (google_id, email, name, profile_image)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (google_id) DO UPDATE SET
       email = EXCLUDED.email,
       name = EXCLUDED.name,
       profile_image = EXCLUDED.profile_image
     RETURNING *`,
    [googleId, email, name, profileImage]
  );
  return users[0];
}

export async function updateUser(
  userId: number,
  updates: Partial<Pick<User, 'name' | 'profile_image'>>
): Promise<User | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    setClauses.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.profile_image !== undefined) {
    setClauses.push(`profile_image = $${paramIndex++}`);
    values.push(updates.profile_image);
  }

  if (setClauses.length === 0) return null;

  values.push(userId);
  const users = await query<User>(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return users[0] || null;
}

// Chat operations
export interface Chat {
  id: number;
  user_id: number;
  title: string;
  created_at: Date;
  updated_at: Date;
}

export async function getChatsForUser(userId: number): Promise<Chat[]> {
  return query<Chat>(
    'SELECT * FROM chats WHERE user_id = $1 ORDER BY updated_at DESC',
    [userId]
  );
}

export async function getChatById(chatId: number, userId: number): Promise<Chat | null> {
  const chats = await query<Chat>(
    'SELECT * FROM chats WHERE id = $1 AND user_id = $2',
    [chatId, userId]
  );
  return chats[0] || null;
}

export async function createChat(userId: number, title?: string): Promise<Chat> {
  const chats = await query<Chat>(
    'INSERT INTO chats (user_id, title) VALUES ($1, $2) RETURNING *',
    [userId, title || 'Ny konversation']
  );
  return chats[0];
}

export async function updateChatTitle(chatId: number, userId: number, title: string): Promise<Chat | null> {
  const chats = await query<Chat>(
    'UPDATE chats SET title = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [title, chatId, userId]
  );
  return chats[0] || null;
}

export async function deleteChat(chatId: number, userId: number): Promise<boolean> {
  const result = await query(
    'DELETE FROM chats WHERE id = $1 AND user_id = $2 RETURNING id',
    [chatId, userId]
  );
  return result.length > 0;
}

// Message operations
export interface Message {
  id: number;
  chat_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: Date;
}

export async function getMessagesForChat(chatId: number): Promise<Message[]> {
  return query<Message>(
    'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC',
    [chatId]
  );
}

export async function addMessage(
  chatId: number,
  role: 'user' | 'assistant' | 'system',
  content: string
): Promise<Message> {
  // Update chat's updated_at timestamp
  await query('UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [chatId]);

  const messages = await query<Message>(
    'INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3) RETURNING *',
    [chatId, role, content]
  );
  return messages[0];
}

// User settings operations
export interface UserSettings {
  id: number;
  user_id: number;
  theme: string;
  language: string;
  created_at: Date;
  updated_at: Date;
}

export async function getUserSettings(userId: number): Promise<UserSettings | null> {
  const settings = await query<UserSettings>(
    'SELECT * FROM user_settings WHERE user_id = $1',
    [userId]
  );
  return settings[0] || null;
}

export async function upsertUserSettings(
  userId: number,
  settings: Partial<Pick<UserSettings, 'theme' | 'language'>>
): Promise<UserSettings> {
  const result = await query<UserSettings>(
    `INSERT INTO user_settings (user_id, theme, language)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET
       theme = COALESCE($2, user_settings.theme),
       language = COALESCE($3, user_settings.language)
     RETURNING *`,
    [userId, settings.theme || 'dark', settings.language || 'sv']
  );
  return result[0];
}

// System prompt operations
export interface SystemPrompt {
  id: number;
  key: string;
  name: string;
  description: string | null;
  content: string;
  created_at: Date;
  updated_at: Date;
}

export async function getAllSystemPrompts(): Promise<SystemPrompt[]> {
  return query<SystemPrompt>('SELECT * FROM system_prompts ORDER BY key');
}

export async function getSystemPromptByKey(key: string): Promise<SystemPrompt | null> {
  const prompts = await query<SystemPrompt>(
    'SELECT * FROM system_prompts WHERE key = $1',
    [key]
  );
  return prompts[0] || null;
}

export async function upsertSystemPrompt(
  key: string,
  name: string,
  description: string | null,
  content: string
): Promise<SystemPrompt> {
  const result = await query<SystemPrompt>(
    `INSERT INTO system_prompts (key, name, description, content)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (key) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       content = EXCLUDED.content
     RETURNING *`,
    [key, name, description, content]
  );
  return result[0];
}

export default pool;
