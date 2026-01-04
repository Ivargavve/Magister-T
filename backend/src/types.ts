// API Request/Response types

export interface AuthGoogleRequest {
  idToken: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    profileImage: string | null;
  };
  settings: {
    theme: string;
    language: string;
  } | null;
}

export interface ChatListResponse {
  chats: {
    id: number;
    title: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
}

export interface ChatResponse {
  id: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: {
    id: number;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: Date;
  }[];
}

export interface CreateChatRequest {
  title?: string;
}

export interface AddMessageRequest {
  content: string;
  role?: 'user' | 'assistant';
}

export interface MessageResponse {
  userMessage: {
    id: number;
    role: string;
    content: string;
    createdAt: Date;
  };
  assistantMessage: {
    id: number;
    role: string;
    content: string;
    createdAt: Date;
  };
}

export interface UpdateSettingsRequest {
  theme?: string;
  language?: string;
  name?: string;
  profileImage?: string;
}

export interface SettingsResponse {
  theme: string;
  language: string;
}

export interface AnonymousChatRequest {
  messages: {
    role: 'user' | 'assistant';
    content: string;
  }[];
}

export interface AnonymousChatResponse {
  response: string;
}

// SSE Stream Events
export interface StreamChunkEvent {
  type: 'chunk';
  content: string;
}

export interface StreamDoneEvent {
  type: 'done';
  messageId: number;
  createdAt: Date;
}

export interface StreamTitleEvent {
  type: 'title';
  title: string;
}

export interface StreamErrorEvent {
  type: 'error';
  error: string;
}

export type StreamEvent = StreamChunkEvent | StreamDoneEvent | StreamTitleEvent | StreamErrorEvent;

// Error response
export interface ErrorResponse {
  error: string;
  message?: string;
}
