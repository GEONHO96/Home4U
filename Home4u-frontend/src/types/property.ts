// 백엔드 Property 엔티티와 동일 필드를 그대로 반영.
// enum 들은 union-literal 로 정의해 오타 방지.

export type PropertyType =
  | 'APARTMENT'
  | 'OFFICETEL'
  | 'HOUSE'
  | 'VILLA'
  | 'STUDIO';

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'APARTMENT', label: '아파트' },
  { value: 'OFFICETEL', label: '오피스텔' },
  { value: 'HOUSE', label: '주택' },
  { value: 'VILLA', label: '빌라' },
  { value: 'STUDIO', label: '원룸' },
];

export type TransactionType =
  | 'SALE'
  | 'JEONSE'
  | 'MONTHLY_RENT'
  | 'SHORT_TERM_RENT';

export const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: 'SALE', label: '매매' },
  { value: 'JEONSE', label: '전세' },
  { value: 'MONTHLY_RENT', label: '월세' },
  { value: 'SHORT_TERM_RENT', label: '단기임대' },
];

export type RoomStructure =
  | 'OPEN_TYPE'
  | 'SEPARATE_TYPE'
  | 'TWO_ROOM'
  | 'THREE_ROOM'
  | 'DUPLEX';

export const ROOM_STRUCTURES: { value: RoomStructure; label: string }[] = [
  { value: 'OPEN_TYPE', label: '오픈형' },
  { value: 'SEPARATE_TYPE', label: '분리형' },
  { value: 'TWO_ROOM', label: '투룸' },
  { value: 'THREE_ROOM', label: '쓰리룸' },
  { value: 'DUPLEX', label: '복층' },
];

export type AdditionalOption =
  | 'ELEVATOR'
  | 'PARKING'
  | 'CCTV'
  | 'SECURITY'
  | 'AIR_CONDITIONER'
  | 'REFRIGERATOR'
  | 'WASHING_MACHINE'
  | 'BALCONY'
  | 'PET_FRIENDLY'
  | 'IMMEDIATE_MOVE_IN'
  | 'JEONSE_LOAN'
  | 'DIRECT_DEAL'
  | 'PRESALE_RIGHT';

export const ADDITIONAL_OPTIONS: { value: AdditionalOption; label: string }[] = [
  { value: 'ELEVATOR', label: '엘리베이터' },
  { value: 'PARKING', label: '주차' },
  { value: 'CCTV', label: 'CCTV' },
  { value: 'SECURITY', label: '보안' },
  { value: 'AIR_CONDITIONER', label: '에어컨' },
  { value: 'REFRIGERATOR', label: '냉장고' },
  { value: 'WASHING_MACHINE', label: '세탁기' },
  { value: 'BALCONY', label: '발코니' },
  { value: 'PET_FRIENDLY', label: '반려동물 가능' },
  { value: 'IMMEDIATE_MOVE_IN', label: '즉시 입주' },
  { value: 'JEONSE_LOAN', label: '전세자금대출' },
  { value: 'DIRECT_DEAL', label: '직거래' },
  { value: 'PRESALE_RIGHT', label: '분양권' },
];

export interface PropertyCreateRequest {
  title: string;
  description: string;
  price: number;
  address: string;
  latitude: number;
  longitude: number;
  dong: string;
  gungu: string;
  floor: number;
  minArea: number;
  maxArea: number;
  propertyType: PropertyType;
  transactionType: TransactionType;
  roomStructure?: RoomStructure;
  additionalOptions?: AdditionalOption[];
}

export interface Property extends PropertyCreateRequest {
  id: number;
  isSold: boolean;
  owner?: {
    id: number;
    username: string;
    role: string;
  };
}
