import type { UserRef } from './transaction';
import type { Property } from './property';

export interface ChatRoom {
  id: number;
  buyer: UserRef;
  seller: UserRef;
  property?: Property | null;
  createdAt: string;
  lastMessageAt: string;
}

export interface ChatMessage {
  id: number;
  room?: { id: number };
  sender: UserRef;
  content: string;
  createdAt: string;
  readAt?: string | null;
}
