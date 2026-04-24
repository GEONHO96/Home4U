import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Property } from '../types/property';

interface Props {
  items: Property[];
  activeId: number | null;
  onSelect: (id: number) => void;
}

// ---- Utilities ----

function formatPrice(p: Property): string {
  // 1만원 단위를 줄여 마커에 표기 (예: 42,000만원 → 4.2억)
  if (p.price >= 10000) {
    const eok = p.price / 10000;
    return eok >= 10
      ? `${Math.round(eok)}억`
      : `${eok.toFixed(1).replace(/\.0$/, '')}억`;
  }
  return `${p.price.toLocaleString()}`;
}

function priceIcon(p: Property, active: boolean): L.DivIcon {
  const label = formatPrice(p);
  const cls = `map-price-marker${p.isSold ? ' sold' : ''}${active ? ' active' : ''}`;
  const style = active ? 'box-shadow: 0 6px 18px rgba(22,115,255,0.35); transform: translate(-50%, -100%) scale(1.12);' : '';
  return L.divIcon({
    className: '',
    html: `<div class="${cls}" style="${style}">${label}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

// items 변경 시 지도 bounds 를 자동 조정
function AutoFit({ items }: { items: Property[] }) {
  const map = useMap();
  useEffect(() => {
    if (items.length === 0) return;
    const bounds = L.latLngBounds(items.map((p) => [p.latitude, p.longitude] as [number, number]));
    map.fitBounds(bounds.pad(0.2), { animate: true, maxZoom: 15 });
  }, [items, map]);
  return null;
}

function MapView({ items, activeId, onSelect }: Props) {
  const center = useMemo<[number, number]>(() => {
    if (items.length > 0) return [items[0].latitude, items[0].longitude];
    return [37.5665, 126.978]; // 서울 시청
  }, [items]);

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom
      style={{ height: '100%', width: '100%', borderRadius: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {items.map((p) => (
        <Marker
          key={p.id}
          position={[p.latitude, p.longitude]}
          icon={priceIcon(p, p.id === activeId)}
          eventHandlers={{ click: () => onSelect(p.id) }}
        />
      ))}
      <AutoFit items={items} />
    </MapContainer>
  );
}

export default MapView;
