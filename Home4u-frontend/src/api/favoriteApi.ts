import axiosInstance from './axiosInstance';
import type { Favorite } from '../types/favorite';

export async function addFavorite(userId: number, propertyId: number) {
  const res = await axiosInstance.post<{ favoriteId: number; favorited: boolean }>(
    '/favorites', null, { params: { userId, propertyId } },
  );
  return res.data;
}

export async function removeFavorite(userId: number, propertyId: number) {
  const res = await axiosInstance.delete<{ favorited: boolean }>('/favorites', {
    params: { userId, propertyId },
  });
  return res.data;
}

export async function checkFavorite(userId: number, propertyId: number): Promise<boolean> {
  const res = await axiosInstance.get<{ favorited: boolean }>('/favorites/check', {
    params: { userId, propertyId },
  });
  return res.data.favorited;
}

export async function listMyFavorites(userId: number): Promise<Favorite[]> {
  const res = await axiosInstance.get<Favorite[]>('/favorites', { params: { userId } });
  return res.data;
}
