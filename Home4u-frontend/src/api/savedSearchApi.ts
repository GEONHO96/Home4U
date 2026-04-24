import axiosInstance from './axiosInstance';
import type { Property, RoomStructure, TransactionType } from '../types/property';

export interface SavedSearch {
  id: number;
  name: string;
  user?: { id: number; username: string };
  transactionType?: TransactionType;
  roomStructure?: RoomStructure;
  minArea?: number;
  maxArea?: number;
  minFloor?: number;
  maxFloor?: number;
  minLat?: number;
  maxLat?: number;
  minLng?: number;
  maxLng?: number;
  keyword?: string;
  createdAt: string;
}

export interface SavedSearchPayload {
  userId: number;
  name: string;
  transactionType?: TransactionType;
  roomStructure?: RoomStructure;
  minArea?: number;
  maxArea?: number;
  minFloor?: number;
  maxFloor?: number;
  minLat?: number;
  maxLat?: number;
  minLng?: number;
  maxLng?: number;
  keyword?: string;
}

export async function createSavedSearch(body: SavedSearchPayload) {
  const res = await axiosInstance.post<{ savedSearchId: number; name: string }>(
    '/saved-searches',
    body,
  );
  return res.data;
}

export async function listMySavedSearches(userId: number): Promise<SavedSearch[]> {
  const res = await axiosInstance.get<SavedSearch[]>('/saved-searches', { params: { userId } });
  return res.data;
}

export async function deleteSavedSearch(id: number, userId: number) {
  await axiosInstance.delete(`/saved-searches/${id}`, { params: { userId } });
}

export async function getMatchingProperties(id: number): Promise<Property[]> {
  const res = await axiosInstance.get<Property[]>(`/saved-searches/${id}/matching`);
  return res.data;
}
