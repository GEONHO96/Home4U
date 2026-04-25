import axiosInstance from './axiosInstance';

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: number;
  amount: number;
  provider: string;
  status: PaymentStatus;
  providerOrderId: string;
  providerPaymentKey?: string | null;
  failureReason?: string | null;
  createdAt: string;
  paidAt?: string | null;
  transaction?: { id: number; status: string };
}

export async function createPaymentIntent(transactionId: number): Promise<Payment> {
  const res = await axiosInstance.post<Payment>('/payments', null, { params: { transactionId } });
  return res.data;
}

export async function confirmPayment(paymentId: number, paymentKey?: string): Promise<Payment> {
  const res = await axiosInstance.post<Payment>(`/payments/${paymentId}/confirm`, { paymentKey });
  return res.data;
}

export async function failPayment(paymentId: number, reason: string): Promise<Payment> {
  const res = await axiosInstance.post<Payment>(`/payments/${paymentId}/fail`, { reason });
  return res.data;
}

export async function listMyPayments(buyerId: number): Promise<Payment[]> {
  const res = await axiosInstance.get<Payment[]>('/payments/me', { params: { buyerId } });
  return res.data;
}
