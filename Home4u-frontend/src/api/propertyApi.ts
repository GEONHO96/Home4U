import axiosInstance from './axiosInstance';
import type { Property, PropertyCreateRequest } from '../types/property';

export async function getAllProperties(): Promise<Property[]> {
  const res = await axiosInstance.get<Property[]>('/properties');
  return res.data;
}

export async function getPropertyById(id: number): Promise<Property> {
  const res = await axiosInstance.get<Property>(`/properties/${id}`);
  return res.data;
}

export async function createProperty(
  payload: PropertyCreateRequest,
  ownerId: number,
): Promise<{ message: string; propertyId: number }> {
  const res = await axiosInstance.post<{ message: string; propertyId: number }>(
    `/properties?ownerId=${ownerId}`,
    payload,
  );
  return res.data;
}
