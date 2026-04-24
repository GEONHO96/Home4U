import axiosInstance from './axiosInstance';

export interface SubwayStation {
  id: number;
  name: string;
  line: string;
  latitude: number;
  longitude: number;
}

export interface School {
  id: number;
  name: string;
  type: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface NearbyStation {
  station: SubwayStation;
  distanceMeters: number;
  walkingMinutes: number;
}

export interface NearbySchool {
  school: School;
  distanceMeters: number;
  walkingMinutes: number;
}

export async function nearbyStations(
  lat: number,
  lng: number,
  radius = 1000,
  limit = 5,
): Promise<NearbyStation[]> {
  const res = await axiosInstance.get<NearbyStation[]>('/subway/nearby', {
    params: { lat, lng, radius, limit },
  });
  return res.data;
}

export async function nearbySchools(
  lat: number,
  lng: number,
  radius = 1500,
  limit = 10,
): Promise<NearbySchool[]> {
  const res = await axiosInstance.get<NearbySchool[]>('/schools/nearby', {
    params: { lat, lng, radius, limit },
  });
  return res.data;
}

export interface AptDealMonthly {
  dealYearMonth: string;
  averagePrice: number;
  count: number;
}

export async function aptDealMonthly(apartmentName: string): Promise<AptDealMonthly[]> {
  const res = await axiosInstance.get<AptDealMonthly[]>('/apt-deals/monthly', {
    params: { apartmentName },
  });
  return res.data;
}
