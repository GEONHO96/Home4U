import axiosInstance from './axiosInstance';
import type { ChatMessage, ChatRoom } from '../types/chat';

export async function openChatRoom(buyerId: number, opts: { sellerId?: number; propertyId?: number }): Promise<ChatRoom> {
  const res = await axiosInstance.post<ChatRoom>('/chats', null, {
    params: { buyerId, sellerId: opts.sellerId, propertyId: opts.propertyId },
  });
  return res.data;
}

export async function listMyChatRooms(userId: number): Promise<ChatRoom[]> {
  const res = await axiosInstance.get<ChatRoom[]>('/chats', { params: { userId } });
  return res.data;
}

export async function listMessages(roomId: number, userId: number): Promise<ChatMessage[]> {
  const res = await axiosInstance.get<ChatMessage[]>(`/chats/${roomId}/messages`, { params: { userId } });
  return res.data;
}

export async function sendMessage(roomId: number, userId: number, content: string): Promise<ChatMessage> {
  const res = await axiosInstance.post<ChatMessage>(`/chats/${roomId}/messages`, { content }, { params: { userId } });
  return res.data;
}

export async function markRead(roomId: number, userId: number): Promise<number> {
  const res = await axiosInstance.post<{ updated: number }>(`/chats/${roomId}/read`, null, { params: { userId } });
  return res.data.updated;
}

export async function unreadCount(roomId: number, userId: number): Promise<number> {
  const res = await axiosInstance.get<{ count: number }>(`/chats/${roomId}/unread-count`, { params: { userId } });
  return res.data.count;
}
