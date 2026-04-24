import { useCallback, useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Property } from '../types/property';

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

interface Props {
  items: Property[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onBoundsChange?: (b: MapBounds) => void;   // 드래그/줌 종료 시
  autoFit?: boolean;                         // items 변경 시 bounds 자동 맞춤 (기본 true)
}

// ---- Utilities ----

function formatPrice(p: Property): string {
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

function AutoFit({ items, enabled }: { items: Property[]; enabled: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled || items.length === 0) return;
    const bounds = L.latLngBounds(items.map((p) => [p.latitude, p.longitude] as [number, number]));
    map.fitBounds(bounds.pad(0.2), { animate: true, maxZoom: 15 });
  }, [items, map, enabled]);
  return null;
}

function BoundsEmitter({ onBoundsChange }: { onBoundsChange?: (b: MapBounds) => void }) {
  const map = useMapEvents({
    moveend: () => {
      if (!onBoundsChange) return;
      const b = map.getBounds();
      onBoundsChange({
        minLat: b.getSouth(),
        maxLat: b.getNorth(),
        minLng: b.getWest(),
        maxLng: b.getEast(),
      });
    },
  });
  return null;
}

function MapView({ items, activeId, onSelect, onBoundsChange, autoFit = true }: Props) {
  const center = useMemo<[number, number]>(() => {
    if (items.length > 0) return [items[0].latitude, items[0].longitude];
    return [37.5665, 126.978];
  }, [items]);

  const handleSelect = useCallback((id: number) => onSelect(id), [onSelect]);

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

      <MarkerClusterGroup chunkedLoading showCoverageOnHover={false} spiderfyOnMaxZoom>
        {items.map((p) => (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={priceIcon(p, p.id === activeId)}
            eventHandlers={{ click: () => handleSelect(p.id) }}
          />
        ))}
      </MarkerClusterGroup>

      <AutoFit items={items} enabled={autoFit} />
      <BoundsEmitter onBoundsChange={onBoundsChange} />
    </MapContainer>
  );
}

export default MapView;
