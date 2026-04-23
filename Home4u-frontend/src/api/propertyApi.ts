import axiosInstance from './axiosInstance';
import type {
  Property,
  PropertyCreateRequest,
  PropertyType,
  RoomStructure,
  TransactionType,
} from '../types/property';

export async function getAllProperties(): Promise<Property[]> {
  const res = await axiosInstance.get<Property[]>('/properties');
  return res.data;
}

export interface CoordinatesSearchParams {
  buildingType?: PropertyType;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export async function searchPropertiesByCoordinates(
  params: CoordinatesSearchParams,
): Promise<Property[]> {
  const res = await axiosInstance.get<Property[]>('/properties/search', { params });
  return res.data;
}

export interface FilterParams {
  transactionType?: TransactionType;
  minArea?: number;
  maxArea?: number;
  minFloor?: number;
  maxFloor?: number;
  roomStructure?: RoomStructure;
}

export async function filterProperties(params: FilterParams): Promise<Property[]> {
  // 빈 값은 파라미터에서 제외 — 백엔드가 IS NULL 분기로 무시하게 한다
  const cleaned: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      cleaned[k] = v as string | number;
    }
  }
  const res = await axiosInstance.get<Property[]>('/properties/filter', { params: cleaned });
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
