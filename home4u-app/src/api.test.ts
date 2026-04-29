import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * api.ts 의 endpoint 헬퍼 + formatPriceHuman 단위 테스트.
 *
 * axios 호출은 mock — 네트워크 의존 없이 헬퍼가 올바른 path/params/body 를 만들고 응답을 풀어내는지만 검증.
 * RN 의존 (Constants, Platform) 은 vi.mock 으로 격리.
 */

// react-native + expo-constants 가 노드 환경에서 import 불가 — 두 모듈을 모두 mock
const { mockApi, mockPlatform } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() } },
  },
  mockPlatform: { OS: 'ios' as 'ios' | 'android' | 'web' },
}));

vi.mock('axios', () => ({
  default: { create: vi.fn(() => mockApi) },
}));
vi.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { apiBaseUrl: 'http://test:8080' } } },
}));
vi.mock('react-native', () => ({
  Platform: mockPlatform,
}));

import {
  API_BASE_URL,
  setToken,
  getSessionToken,
  login,
  logout,
  formatPriceHuman,
  checkFavorite,
  addFavorite,
  removeFavorite,
  listMyFavorites,
  getReviews,
  getAverageRating,
  createReview,
  deleteReview,
  listProperties,
  getProperty,
  requestTransaction,
  registerPushToken,
  getMyTransactionsAsBuyer,
  createPaymentIntent,
  confirmPayment,
  listChatRooms,
  listChatMessages,
  sendChatMessage,
  openChatRoom,
  getUnreadCount,
  markRead,
  getSessionUserId,
  getSessionUsername,
} from './api';

beforeEach(() => {
  mockApi.get.mockReset();
  mockApi.post.mockReset();
  mockApi.delete.mockReset();
});

afterEach(() => {
  setToken(null);
});

describe('formatPriceHuman', () => {
  it('1만 미만은 만원 단위 + 콤마', () => {
    expect(formatPriceHuman(3000)).toBe('3,000만원');
    expect(formatPriceHuman(1)).toBe('1만원');
  });
  it('1만 이상 10만 미만은 억 + 소수점 1자리 (.0 트림)', () => {
    expect(formatPriceHuman(15000)).toBe('1.5억');
    expect(formatPriceHuman(10000)).toBe('1억');
    expect(formatPriceHuman(99999)).toBe('10억'); // 9.99... → 반올림
  });
  it('10억 이상은 정수 억', () => {
    expect(formatPriceHuman(100000)).toBe('10억');
    expect(formatPriceHuman(250000)).toBe('25억');
  });
});

describe('API_BASE_URL · token', () => {
  it('extra.apiBaseUrl 가 있으면 우선 사용', () => {
    expect(API_BASE_URL).toBe('http://test:8080');
  });
  it('setToken / getSessionToken 캐시 동작', () => {
    expect(getSessionToken()).toBeNull();
    setToken('jwt-abc');
    expect(getSessionToken()).toBe('jwt-abc');
    setToken(null);
    expect(getSessionToken()).toBeNull();
  });
});

describe('auth · login / logout', () => {
  it('login 응답으로 token / userId / username 캐시', async () => {
    mockApi.post.mockResolvedValueOnce({
      data: { token: 'jwt-xyz', userId: 42, username: 'alice', role: 'ROLE_USER' },
    });
    const res = await login('alice', 'pw');
    expect(mockApi.post).toHaveBeenCalledWith('/users/login', { username: 'alice', password: 'pw' });
    expect(res.userId).toBe(42);
    expect(getSessionToken()).toBe('jwt-xyz');
    expect(getSessionUserId()).toBe(42);
    expect(getSessionUsername()).toBe('alice');
  });
  it('logout 으로 캐시 초기화', () => {
    setToken('jwt-1');
    logout();
    expect(getSessionToken()).toBeNull();
    expect(getSessionUserId()).toBeNull();
    expect(getSessionUsername()).toBeNull();
  });
});

describe('favorites · 4개 헬퍼', () => {
  it('checkFavorite 가 favorited 필드 반환', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { favorited: true } });
    expect(await checkFavorite(1, 99)).toBe(true);
    expect(mockApi.get).toHaveBeenCalledWith('/favorites/check', { params: { userId: 1, propertyId: 99 } });
  });
  it('addFavorite POST', async () => {
    mockApi.post.mockResolvedValueOnce({ data: {} });
    await addFavorite(1, 99);
    expect(mockApi.post).toHaveBeenCalledWith('/favorites', null, { params: { userId: 1, propertyId: 99 } });
  });
  it('removeFavorite DELETE', async () => {
    mockApi.delete.mockResolvedValueOnce({ data: {} });
    await removeFavorite(1, 99);
    expect(mockApi.delete).toHaveBeenCalledWith('/favorites', { params: { userId: 1, propertyId: 99 } });
  });
  it('listMyFavorites 응답 그대로 반환', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [{ id: 1 }] });
    const res = await listMyFavorites(7);
    expect(res).toEqual([{ id: 1 }]);
  });
});

describe('reviews · CRUD 헬퍼', () => {
  it('getReviews path', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [{ id: 1 }] });
    await getReviews(99);
    expect(mockApi.get).toHaveBeenCalledWith('/reviews/99');
  });
  it('getAverageRating 가 NaN 일 때 0 으로 폴백', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { averageRating: NaN } });
    expect(await getAverageRating(99)).toBe(0);
  });
  it('createReview params 전달', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { reviewId: 5 } });
    await createReview({ propertyId: 99, userId: 1, rating: 5, comment: 'good' });
    expect(mockApi.post).toHaveBeenCalledWith('/reviews', null, {
      params: { propertyId: 99, userId: 1, rating: 5, comment: 'good' },
    });
  });
  it('deleteReview path + userId param', async () => {
    mockApi.delete.mockResolvedValueOnce({ data: {} });
    await deleteReview(5, 1);
    expect(mockApi.delete).toHaveBeenCalledWith('/reviews/5', { params: { userId: 1 } });
  });
});

describe('properties · 2개 헬퍼', () => {
  it('listProperties / getProperty', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: [{ id: 1 }] })
      .mockResolvedValueOnce({ data: { id: 99 } });
    expect(await listProperties()).toEqual([{ id: 1 }]);
    expect(await getProperty(99)).toEqual({ id: 99 });
  });
});

describe('transactions / payments · 핵심 흐름', () => {
  it('requestTransaction path 에 buyerId 포함', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { id: 1, status: 'PENDING' } });
    await requestTransaction(99, 2);
    expect(mockApi.post).toHaveBeenCalledWith('/properties/99/transactions?buyerId=2');
  });
  it('getMyTransactionsAsBuyer / createPaymentIntent / confirmPayment', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [{ id: 1, status: 'APPROVED' }] });
    expect(await getMyTransactionsAsBuyer(2)).toEqual([{ id: 1, status: 'APPROVED' }]);

    mockApi.post.mockResolvedValueOnce({ data: { id: 11, amount: 30000, providerOrderId: 'h4u-11', status: 'PENDING' } });
    const intent = await createPaymentIntent(1);
    expect(mockApi.post).toHaveBeenCalledWith('/payments', null, { params: { transactionId: 1 } });
    expect(intent.id).toBe(11);

    mockApi.post.mockResolvedValueOnce({ data: { id: 11, status: 'SUCCEEDED' } });
    const result = await confirmPayment(11, 'stub-key');
    expect(mockApi.post).toHaveBeenCalledWith('/payments/11/confirm', { paymentKey: 'stub-key' });
    expect(result.status).toBe('SUCCEEDED');
  });
});

describe('chat · 6개 헬퍼', () => {
  it('listChatRooms / listChatMessages / sendChatMessage', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [{ id: 1 }] });
    expect(await listChatRooms(2)).toEqual([{ id: 1 }]);

    mockApi.get.mockResolvedValueOnce({ data: [{ id: 11, content: 'hi' }] });
    await listChatMessages(1);
    expect(mockApi.get).toHaveBeenLastCalledWith('/chats/1/messages');

    mockApi.post.mockResolvedValueOnce({ data: { id: 12, content: 'echo' } });
    const sent = await sendChatMessage(1, 2, 'hello');
    expect(mockApi.post).toHaveBeenLastCalledWith('/chats/1/messages', { content: 'hello' }, { params: { userId: 2 } });
    expect(sent.id).toBe(12);
  });
  it('openChatRoom / getUnreadCount / markRead', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { id: 7 } });
    await openChatRoom(2, { sellerId: 3, propertyId: 99 });
    expect(mockApi.post).toHaveBeenLastCalledWith('/chats', null, { params: { buyerId: 2, sellerId: 3, propertyId: 99 } });

    mockApi.get.mockResolvedValueOnce({ data: { count: 5 } });
    expect(await getUnreadCount(7, 2)).toBe(5);

    mockApi.post.mockResolvedValueOnce({ data: {} });
    await markRead(7, 2);
    expect(mockApi.post).toHaveBeenLastCalledWith('/chats/7/read', null, { params: { userId: 2 } });
  });
});

describe('push · registerPushToken', () => {
  it('platform 과 token body 전달', async () => {
    mockApi.post.mockResolvedValueOnce({ data: {} });
    await registerPushToken(2, 'expo-token-abc', 'ios');
    expect(mockApi.post).toHaveBeenLastCalledWith('/push/register', { token: 'expo-token-abc', platform: 'ios' }, { params: { userId: 2 } });
  });
});
