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

-- Chat groups table
CREATE TABLE IF NOT EXISTS chat_groups (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL DEFAULT 'Ny grupp',
  is_expanded BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chats table
CREATE TABLE IF NOT EXISTS chats (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  group_id INTEGER REFERENCES chat_groups(id) ON DELETE SET NULL,
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

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_group_id ON chats(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_groups_user_id ON chat_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

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
`;

// Migration to add group_id column to existing chats table
const migration = `
-- Add group_id column to chats if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chats' AND column_name = 'group_id') THEN
    ALTER TABLE chats ADD COLUMN group_id INTEGER REFERENCES chat_groups(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_chats_group_id ON chats(group_id);
  END IF;
END $$;
`;

// Initialize database schema
export async function initializeDatabase(): Promise<void> {
  try {
    await pool.query(schema);
    console.log('Database schema initialized successfully');

    // Run migrations
    await pool.query(migration);
    console.log('Database migrations completed');
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

// Chat group operations
export interface ChatGroup {
  id: number;
  user_id: number;
  name: string;
  is_expanded: boolean;
  created_at: Date;
}

export async function getGroupsForUser(userId: number): Promise<ChatGroup[]> {
  return query<ChatGroup>(
    'SELECT * FROM chat_groups WHERE user_id = $1 ORDER BY created_at ASC',
    [userId]
  );
}

export async function createGroup(userId: number, name?: string): Promise<ChatGroup> {
  const groups = await query<ChatGroup>(
    'INSERT INTO chat_groups (user_id, name) VALUES ($1, $2) RETURNING *',
    [userId, name || 'Ny grupp']
  );
  return groups[0];
}

export async function updateGroup(
  groupId: number,
  userId: number,
  updates: Partial<Pick<ChatGroup, 'name' | 'is_expanded'>>
): Promise<ChatGroup | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    setClauses.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.is_expanded !== undefined) {
    setClauses.push(`is_expanded = $${paramIndex++}`);
    values.push(updates.is_expanded);
  }

  if (setClauses.length === 0) return null;

  values.push(groupId, userId);
  const groups = await query<ChatGroup>(
    `UPDATE chat_groups SET ${setClauses.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING *`,
    values
  );
  return groups[0] || null;
}

export async function deleteGroup(groupId: number, userId: number): Promise<boolean> {
  const result = await query(
    'DELETE FROM chat_groups WHERE id = $1 AND user_id = $2 RETURNING id',
    [groupId, userId]
  );
  return result.length > 0;
}

// Chat operations
export interface Chat {
  id: number;
  user_id: number;
  group_id: number | null;
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

export async function createChat(userId: number, title?: string, groupId?: number | null): Promise<Chat> {
  const chats = await query<Chat>(
    'INSERT INTO chats (user_id, title, group_id) VALUES ($1, $2, $3) RETURNING *',
    [userId, title || 'Ny konversation', groupId || null]
  );
  return chats[0];
}

export async function moveChatToGroup(chatId: number, userId: number, groupId: number | null): Promise<Chat | null> {
  const chats = await query<Chat>(
    'UPDATE chats SET group_id = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [groupId, chatId, userId]
  );
  return chats[0] || null;
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

export default pool;
