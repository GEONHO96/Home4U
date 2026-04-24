import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { aptDealMonthly, type AptDealMonthly } from '../api/nearbyApi';

interface Props {
  apartmentName: string;
}

function formatKrw(priceManWon: number): string {
  if (priceManWon >= 10000) {
    const eok = priceManWon / 10000;
    return eok >= 10 ? `${Math.round(eok)}억` : `${eok.toFixed(1).replace(/\.0$/, '')}억`;
  }
  return `${priceManWon.toLocaleString()}만원`;
}

export default function DealChart({ apartmentName }: Props) {
  const [data, setData] = useState<AptDealMonthly[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apartmentName) return;
    aptDealMonthly(apartmentName)
      .then(setData)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '실거래가를 불러오지 못했습니다.');
        setData([]);
      });
  }, [apartmentName]);

  if (error) {
    return (
      <section className="card" style={{ marginTop: '0.85rem' }}>
        <div className="card-body">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>실거래가</h2>
          <div className="alert alert-error" role="alert">{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="card" style={{ marginTop: '0.85rem' }}>
      <div className="card-body">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>실거래가 추이</h2>
        <p className="subtle" style={{ fontSize: '0.82rem', margin: '0 0 0.5rem' }}>
          "{apartmentName}" 월별 평균 거래가 (샘플 데이터 · 실제 서비스에선 국토부 실거래가 API 연동)
        </p>

        {data === null ? (
          <p className="muted">불러오는 중…</p>
        ) : data.length === 0 ? (
          <p className="subtle">해당 단지의 거래 기록이 아직 없습니다.</p>
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ebedf0" />
                <XAxis dataKey="dealYearMonth" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => formatKrw(Number(v))}
                  width={70}
                />
                <Tooltip
                  formatter={(value) => [formatKrw(Number(value)), '평균가']}
                  labelFormatter={(l) => `연월: ${l}`}
                />
                <Line
                  type="monotone"
                  dataKey="averagePrice"
                  stroke="#1673ff"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}
