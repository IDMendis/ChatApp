export const API_BASE = import.meta.env.VITE_API_BASE || '';
export const WS_URL = `${API_BASE}/ws`;
export const TOPIC_PUBLIC = '/topic/public';
export const SEND_MESSAGE_DEST = '/app/chat.sendMessage';
export const ADD_USER_DEST = '/app/chat.addUser';

export type ChatMessage = {
  sender?: string;
  content?: string;
  type?: 'CHAT' | 'JOIN' | 'LEAVE';
};
