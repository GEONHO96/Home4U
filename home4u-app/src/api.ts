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

// ------- Endpoints -------

export async function login(username: string, password: string) {
  const res = await api.post<{ token: string; userId: number; username: string; role: string }>(
    '/users/login',
    { username, password },
  );
  setToken(res.data.token);
  return res.data;
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

export function formatPriceHuman(price: number): string {
  if (price >= 10000) {
    const eok = price / 10000;
    return eok >= 10 ? `${Math.round(eok)}억` : `${eok.toFixed(1).replace(/\.0$/, '')}억`;
  }
  return `${price.toLocaleString()}만원`;
}
