import { useEffect, useState } from 'react';
import type { Property } from '../types/property';

const KEY = 'home4u:recently-viewed';
const MAX = 6;

type RecentItem = Pick<
  Property,
  'id' | 'title' | 'price' | 'address' | 'propertyType' | 'transactionType' | 'imageUrl' | 'isSold'
>;

function read(): RecentItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: RecentItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* quota exceeded — 무시 */
  }
}

export function pushRecentlyViewed(p: Property) {
  const item: RecentItem = {
    id: p.id,
    title: p.title,
    price: p.price,
    address: p.address,
    propertyType: p.propertyType,
    transactionType: p.transactionType,
    imageUrl: p.imageUrl,
    isSold: p.isSold,
  };
  const current = read().filter((x) => x.id !== item.id);
  write([item, ...current].slice(0, MAX));
}

export function useRecentlyViewed(): RecentItem[] {
  const [items, setItems] = useState<RecentItem[]>(() => read());
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  return items;
}
