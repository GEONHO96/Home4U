import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * 기본 API Base URL 결정 규칙
 * - app.json extra.apiBaseUrl 가 있으면 우선
 * - Android 에뮬레이터는 호스트 머신을 10.0.2.2 로 봄
 * - iOS 시뮬레이터 / 웹은 localhost
 * - 실기기는 EAS build 시 EAS 시크릿 또는 app.config 에 주입
 */
const fromExtra =
  (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl;

const fallback =
  Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';

export const API_BASE_URL = fromExtra ?? fallback;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
});

let cachedToken: string | null = null;
export function setToken(token: string | null) {
  cachedToken = token;
}
api.interceptors.request.use((config) => {
  if (cachedToken) {
    config.headers.Authorization = `Bearer ${cachedToken}`;
  }
  return config;
});

// ------- Types (프론트와 동일 스키마) -------

export interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  address: string;
  latitude: number;
  longitude: number;
  propertyType: string;
  transactionType: string;
  floor: number;
  minArea: number;
  maxArea: number;
  isSold: boolean;
  imageUrl?: string;
  views?: number;
}

export interface Review {
  id: number;
  user?: { id: number; username: string };
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Favorite {
  id: number;
  property: Property;
  createdAt: string;
}

let cachedUserId: number | null = null;
let cachedUsername: string | null = null;
export function getSessionUserId(): number | null {
  return cachedUserId;
}
export function getSessionUsername(): string | null {
  return cachedUsername;
}

// ------- Endpoints -------

export async function login(username: string, password: string) {
  const res = await api.post<{ token: string; userId: number; username: string; role: string }>(
    '/users/login',
    { username, password },
  );
  setToken(res.data.token);
  cachedUserId = res.data.userId;
  cachedUsername = res.data.username;
  return res.data;
}

export function logout() {
  setToken(null);
  cachedUserId = null;
  cachedUsername = null;
}

// ---- Favorites ----

export async function checkFavorite(userId: number, propertyId: number): Promise<boolean> {
  const res = await api.get<{ favorited: boolean }>('/favorites/check', { params: { userId, propertyId } });
  return res.data.favorited;
}
export async function addFavorite(userId: number, propertyId: number) {
  await api.post('/favorites', null, { params: { userId, propertyId } });
}
export async function removeFavorite(userId: number, propertyId: number) {
  await api.delete('/favorites', { params: { userId, propertyId } });
}
export async function listMyFavorites(userId: number): Promise<Favorite[]> {
  const res = await api.get<Favorite[]>('/favorites', { params: { userId } });
  return res.data;
}

// ---- Reviews ----

export async function getReviews(propertyId: number): Promise<Review[]> {
  const res = await api.get<Review[]>(`/reviews/${propertyId}`);
  return res.data;
}
export async function getAverageRating(propertyId: number): Promise<number> {
  const res = await api.get<{ averageRating: number }>(`/reviews/${propertyId}/rating`);
  return Number.isFinite(res.data.averageRating) ? res.data.averageRating : 0;
}
export async function createReview(args: {
  propertyId: number; userId: number; rating: number; comment: string;
}): Promise<{ reviewId: number }> {
  const res = await api.post<{ reviewId: number }>('/reviews', null, { params: args });
  return res.data;
}
export async function deleteReview(reviewId: number, userId: number) {
  await api.delete(`/reviews/${reviewId}`, { params: { userId } });
}

export async function listProperties(): Promise<Property[]> {
  const res = await api.get<Property[]>('/properties');
  return res.data;
}

export async function getProperty(id: number): Promise<Property> {
  const res = await api.get<Property>(`/properties/${id}`);
  return res.data;
}

export async function requestTransaction(propertyId: number, buyerId: number) {
  const res = await api.post<{ id: number; status: string }>(
    `/properties/${propertyId}/transactions?buyerId=${buyerId}`,
  );
  return res.data;
}

export async function registerPushToken(userId: number, token: string, platform: string) {
  await api.post('/push/register', { token, platform }, { params: { userId } });
}

// ---- Transactions / Payments ----

export interface Transaction {
  id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  property?: { id: number; title: string; price: number };
  buyer?: { id: number; username: string };
  seller?: { id: number; username: string };
  date?: string | null;
}

export async function getMyTransactionsAsBuyer(buyerId: number): Promise<Transaction[]> {
  const res = await api.get<Transaction[]>(`/transactions/buyer/${buyerId}`);
  return res.data;
}

export async function createPaymentIntent(transactionId: number) {
  const res = await api.post<{ id: number; amount: number; providerOrderId: string; status: string }>(
    '/payments', null, { params: { transactionId } },
  );
  return res.data;
}

export async function confirmPayment(paymentId: number, paymentKey?: string) {
  const res = await api.post<{ id: number; status: string }>(
    `/payments/${paymentId}/confirm`, { paymentKey },
  );
  return res.data;
}

// ---- Chat ----

export interface ChatRoom {
  id: number;
  buyer?: { id: number; username: string };
  seller?: { id: number; username: string };
  property?: { id: number; title: string };
  lastMessageAt?: string;
}

export interface ChatMessage {
  id: number;
  sender?: { id: number; username: string };
  content: string;
  createdAt: string;
  readAt?: string | null;
}

export async function listChatRooms(userId: number): Promise<ChatRoom[]> {
  const res = await api.get<ChatRoom[]>('/chats', { params: { userId } });
  return res.data;
}

export async function listChatMessages(roomId: number): Promise<ChatMessage[]> {
  const res = await api.get<ChatMessage[]>(`/chats/${roomId}/messages`);
  return res.data;
}

export async function sendChatMessage(roomId: number, userId: number, content: string) {
  const res = await api.post<ChatMessage>(`/chats/${roomId}/messages`, { content }, { params: { userId } });
  return res.data;
}

export async function openChatRoom(buyerId: number, args: { sellerId?: number; propertyId?: number }) {
  const res = await api.post<ChatRoom>('/chats', null, {
    params: { buyerId, sellerId: args.sellerId, propertyId: args.propertyId },
  });
  return res.data;
}

export async function getUnreadCount(roomId: number, userId: number): Promise<number> {
  const res = await api.get<{ count: number }>(`/chats/${roomId}/unread-count`, { params: { userId } });
  return res.data.count;
}

export async function markRead(roomId: number, userId: number): Promise<void> {
  await api.post(`/chats/${roomId}/read`, null, { params: { userId } });
}

export function formatPriceHuman(price: number): string {
  if (price >= 10000) {
    const eok = price / 10000;
    return eok >= 10 ? `${Math.round(eok)}억` : `${eok.toFixed(1).replace(/\.0$/, '')}억`;
  }
  return `${price.toLocaleString()}만원`;
}
