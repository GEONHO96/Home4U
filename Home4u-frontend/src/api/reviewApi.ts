import axiosInstance from './axiosInstance';
import type { Review } from '../types/review';

export async function getReviewsByProperty(propertyId: number): Promise<Review[]> {
  const res = await axiosInstance.get<Review[]>(`/reviews/${propertyId}`);
  return res.data;
}

export async function getAverageRating(propertyId: number): Promise<number> {
  const res = await axiosInstance.get<{ propertyId: number; averageRating: number }>(
    `/reviews/${propertyId}/rating`,
  );
  return res.data.averageRating;
}

export async function countReviews(propertyId: number): Promise<number> {
  const res = await axiosInstance.get<{ propertyId: number; reviewCount: number }>(
    `/reviews/${propertyId}/count`,
  );
  return res.data.reviewCount;
}

export async function createReview(params: {
  propertyId: number;
  userId: number;
  rating: number;
  comment: string;
}): Promise<{ message: string; reviewId: number }> {
  const res = await axiosInstance.post<{ message: string; reviewId: number }>(
    '/reviews',
    null,
    { params },
  );
  return res.data;
}

export async function deleteReview(reviewId: number, userId: number): Promise<void> {
  await axiosInstance.delete(`/reviews/${reviewId}`, { params: { userId } });
}
