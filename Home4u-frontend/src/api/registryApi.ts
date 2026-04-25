import axiosInstance from './axiosInstance';

export interface RegistryReport {
  propertyId: number;
  address: string;
  verifiedAt: string;
  ownerNameMasked: string | null;
  liens: number;
  seizures: number;
  clean: boolean;
  notes: string[];
  source: 'stub' | 'registry-api';
}

export async function getRegistry(propertyId: number): Promise<RegistryReport> {
  const res = await axiosInstance.get<RegistryReport>(`/registry/properties/${propertyId}`);
  return res.data;
}
