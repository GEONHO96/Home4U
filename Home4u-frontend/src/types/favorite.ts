import type { Property } from './property';
import type { UserRef } from './transaction';

export interface Favorite {
  id: number;
  user: UserRef;
  property: Property;
  createdAt: string;
}
