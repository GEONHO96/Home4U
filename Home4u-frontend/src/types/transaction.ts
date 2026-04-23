import type { Property } from './property';

export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export const TRANSACTION_STATUSES: { value: TransactionStatus; label: string }[] = [
  { value: 'PENDING', label: '대기' },
  { value: 'APPROVED', label: '승인' },
  { value: 'REJECTED', label: '거절' },
  { value: 'COMPLETED', label: '완료' },
];

export interface UserRef {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  role?: string;
  licenseNumber?: string | null;
  agencyName?: string | null;
}

export interface Transaction {
  id: number;
  property: Property & { owner?: UserRef };
  buyer: UserRef;
  seller: UserRef;
  status: TransactionStatus;
  date: string | null;
}
