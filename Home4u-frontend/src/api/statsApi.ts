import axiosInstance from './axiosInstance';

export interface RealtorStats {
  userId: number;
  username: string;
  role: string;
  propertyCount: number;
  totalReviews: number;
  averageRating: number | null;
  totalFavorites: number;
  totalTransactions: number;
  completionRate: number | null;
  medianResponseMinutes: number | null;
}

export async function getRealtorStats(userId: number): Promise<RealtorStats> {
  const res = await axiosInstance.get<RealtorStats>(`/users/${userId}/realtor-stats`);
  return res.data;
}
