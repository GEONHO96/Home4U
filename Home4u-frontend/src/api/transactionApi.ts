import axiosInstance from './axiosInstance';
import type { Transaction } from '../types/transaction';

export async function requestTransaction(propertyId: number, buyerId: number): Promise<Transaction> {
  const res = await axiosInstance.post<Transaction>(
    `/properties/${propertyId}/transactions?buyerId=${buyerId}`,
  );
  return res.data;
}

export async function approveTransaction(transactionId: number): Promise<{ message: string }> {
  const res = await axiosInstance.post<{ message: string }>(
    `/properties/transactions/${transactionId}/approve`,
  );
  return res.data;
}

export async function getTransactionsByBuyer(buyerId: number): Promise<Transaction[]> {
  const res = await axiosInstance.get<Transaction[]>(`/transactions/buyer/${buyerId}`);
  return res.data;
}

export async function getTransactionsBySeller(sellerId: number): Promise<Transaction[]> {
  const res = await axiosInstance.get<Transaction[]>(`/transactions/seller/${sellerId}`);
  return res.data;
}
