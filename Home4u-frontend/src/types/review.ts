import type { UserRef } from './transaction';

export interface Review {
  id: number;
  user: UserRef;
  rating: number; // 1 ~ 5
  comment: string;
  createdAt: string; // ISO datetime
}
