import axiosInstance from './axiosInstance';
import type { Property } from '../types/property';

export interface AdminSummary {
  totalUsers: number;
  totalProperties: number;
  totalTransactions: number;
  usersByRole: Record<string, number>;
  transactionsByStatus: Record<string, number>;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  phone?: string;
  role: string;
  agencyName?: string;
  licenseNumber?: string;
}

export interface AdminTransaction {
  id: number;
  status: string;
  date?: string;
  property?: { id: number; title?: string } | null;
  buyer?: { id: number; username: string } | null;
  seller?: { id: number; username: string } | null;
}

export interface Page<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export async function getAdminSummary(): Promise<AdminSummary> {
  const res = await axiosInstance.get<AdminSummary>('/admin/summary');
  return res.data;
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const res = await axiosInstance.get<AdminUser[]>('/admin/users');
  return res.data;
}

export async function listAdminProperties(page = 0, size = 20): Promise<Page<Property>> {
  const res = await axiosInstance.get<Page<Property>>('/admin/properties', {
    params: { page, size },
  });
  return res.data;
}

export async function listAdminTransactions(): Promise<AdminTransaction[]> {
  const res = await axiosInstance.get<AdminTransaction[]>('/admin/transactions');
  return res.data;
}

export async function deleteAdminProperty(id: number): Promise<void> {
  await axiosInstance.delete(`/admin/properties/${id}`);
}
