import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getPriceDistribution,
  getPropertiesPerDay,
  getTransactionsPerDay,
  type MetricBucket,
} from '../api/adminApi';

const ACCENT = '#1673ff';
const ALT = '#7d4cff';
const PIE_COLORS = ['#1673ff', '#28c76f', '#ff9f43', '#ea5455', '#7d4cff'];

export default function AdminCharts() {
  const [props, setProps] = useState<MetricBucket[]>([]);
  const [txs, setTxs] = useState<MetricBucket[]>([]);
  const [bands, setBands] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    getPropertiesPerDay(14).then(setProps).catch(() => {});
    getTransactionsPerDay(14).then(setTxs).catch(() => {});
    getPriceDistribution()
      .then((m) => setBands(Object.entries(m).map(([k, v]) => ({ name: k, value: v }))))
      .catch(() => {});
  }, []);

  return (
    <div style={{ display: 'grid', gap: '0.85rem' }}>
      <div className="card">
        <div className="card-body">
          <h3 style={{ margin: 0, fontSize: '1rem' }}>최근 14일 매물 등록</h3>
          <div style={{ width: '100%', height: 200, marginTop: 8 }}>
            <ResponsiveContainer>
              <LineChart data={props}>
                <CartesianGrid stroke="#eef2f7" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke={ACCENT} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h3 style={{ margin: 0, fontSize: '1rem' }}>최근 14일 거래</h3>
          <div style={{ width: '100%', height: 200, marginTop: 8 }}>
            <ResponsiveContainer>
              <BarChart data={txs}>
                <CartesianGrid stroke="#eef2f7" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill={ALT} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h3 style={{ margin: 0, fontSize: '1rem' }}>매물 가격대 분포</h3>
          <div style={{ width: '100%', height: 220, marginTop: 8 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={bands} dataKey="value" nameKey="name" outerRadius={80} innerRadius={40} label>
                  {bands.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
