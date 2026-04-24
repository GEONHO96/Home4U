import { useEffect, useState } from 'react';
import { nearbySchools, nearbyStations, type NearbySchool, type NearbyStation } from '../api/nearbyApi';

interface Props {
  lat: number;
  lng: number;
}

function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;
}

export default function NearbyPanel({ lat, lng }: Props) {
  const [stations, setStations] = useState<NearbyStation[] | null>(null);
  const [schools, setSchools] = useState<NearbySchool[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setError(null);
    Promise.all([nearbyStations(lat, lng, 1500, 6), nearbySchools(lat, lng, 1500, 8)])
      .then(([st, sc]) => {
        setStations(st);
        setSchools(sc);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : '주변 정보 로드 실패';
        setError(msg);
        setStations([]);
        setSchools([]);
      });
  }, [lat, lng]);

  return (
    <section className="card" style={{ marginTop: '0.85rem' }}>
      <div className="card-body">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>주변 시설</h2>
        {error && <div className="alert alert-error" role="alert" style={{ marginBottom: '0.5rem' }}>{error}</div>}
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <div>
            <h3 style={{ fontSize: '0.92rem', margin: '0 0 0.3rem' }}>🚇 지하철</h3>
            {stations === null ? (
              <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>로딩…</p>
            ) : stations.length === 0 ? (
              <p className="subtle" style={{ fontSize: '0.82rem', margin: 0 }}>반경 1.5km 내 역이 없습니다.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {stations.map((n, i) => (
                  <li key={`${n.station.id}-${i}`} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', padding: '0.2rem 0', fontSize: '0.88rem' }}>
                    <span style={{ fontWeight: 600 }}>{n.station.name}</span>
                    <span className="badge">{n.station.line}</span>
                    <span style={{ flex: 1 }} />
                    <span className="subtle" style={{ fontSize: '0.78rem' }}>
                      {formatDistance(n.distanceMeters)} · 도보 {n.walkingMinutes}분
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '0.92rem', margin: '0 0 0.3rem' }}>🏫 학교</h3>
            {schools === null ? (
              <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>로딩…</p>
            ) : schools.length === 0 ? (
              <p className="subtle" style={{ fontSize: '0.82rem', margin: 0 }}>반경 1.5km 내 학교가 없습니다.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {schools.map((n, i) => (
                  <li key={`${n.school.id}-${i}`} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', padding: '0.2rem 0', fontSize: '0.88rem' }}>
                    <span style={{ fontWeight: 600 }}>{n.school.name}</span>
                    <span className="badge">{n.school.type}</span>
                    <span style={{ flex: 1 }} />
                    <span className="subtle" style={{ fontSize: '0.78rem' }}>
                      {formatDistance(n.distanceMeters)} · 도보 {n.walkingMinutes}분
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
