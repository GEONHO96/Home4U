import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import {
  deleteAdminProperty,
  getAdminSummary,
  listAdminProperties,
  listAdminTransactions,
  listAdminUsers,
  type AdminSummary,
  type AdminTransaction,
  type AdminUser,
  type Page,
} from '../api/adminApi';
import type { Property } from '../types/property';

type Tab = 'summary' | 'users' | 'properties' | 'transactions';

function roleLabel(role: string): string {
  if (role === 'ROLE_ADMIN') return '관리자';
  if (role === 'ROLE_REALTOR') return '공인중개사';
  return '일반';
}

function AdminPage() {
  const role = localStorage.getItem('role');
  const [params, setParams] = useSearchParams();
  const initial = (params.get('tab') as Tab) ?? 'summary';
  const [tab, setTabState] = useState<Tab>(initial);
  const setTab = (t: Tab) => {
    setTabState(t);
    setParams({ tab: t }, { replace: true });
  };
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [propertiesPage, setPropertiesPage] = useState<Page<Property> | null>(null);
  const [transactions, setTransactions] = useState<AdminTransaction[] | null>(null);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role !== 'ROLE_ADMIN') return;
    setError(null);
    if (tab === 'summary') getAdminSummary().then(setSummary).catch(handleErr);
    else if (tab === 'users') listAdminUsers().then(setUsers).catch(handleErr);
    else if (tab === 'properties') listAdminProperties(page, 20).then(setPropertiesPage).catch(handleErr);
    else if (tab === 'transactions') listAdminTransactions().then(setTransactions).catch(handleErr);
  }, [tab, page, role]);

  function handleErr(e: unknown) {
    const msg = e instanceof Error ? e.message : '불러오지 못했습니다.';
    setError(msg);
  }

  async function handleDelete(id: number) {
    if (!confirm(`매물 #${id} 를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return;
    try {
      await deleteAdminProperty(id);
      const next = await listAdminProperties(page, 20);
      setPropertiesPage(next);
    } catch (e) {
      handleErr(e);
    }
  }

  if (role !== 'ROLE_ADMIN') return <Navigate to="/" replace />;

  return (
    <section className="container" style={{ padding: '1.5rem 1.25rem 3rem' }}>
      <h1 style={{ fontSize: '1.4rem', margin: '0 0 0.75rem' }}>관리자 콘솔</h1>
      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <TabBtn active={tab === 'summary'} onClick={() => setTab('summary')}>요약</TabBtn>
        <TabBtn active={tab === 'users'} onClick={() => setTab('users')}>사용자</TabBtn>
        <TabBtn active={tab === 'properties'} onClick={() => setTab('properties')}>매물</TabBtn>
        <TabBtn active={tab === 'transactions'} onClick={() => setTab('transactions')}>거래</TabBtn>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {tab === 'summary' && summary && (
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          <div className="card">
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
              <SummaryCell label="사용자" value={summary.totalUsers} />
              <SummaryCell label="매물" value={summary.totalProperties} />
              <SummaryCell label="거래" value={summary.totalTransactions} />
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>사용자 Role 분포</h3>
              <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                {Object.entries(summary.usersByRole).map(([k, v]) => (
                  <li key={k}>{roleLabel(k)} <strong>{v}</strong>명</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>거래 상태 분포</h3>
              <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                {Object.entries(summary.transactionsByStatus).map(([k, v]) => (
                  <li key={k}>{k} <strong>{v}</strong>건</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && users && (
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-muted, #f5f7fb)' }}>
                <th style={th}>ID</th>
                <th style={th}>username</th>
                <th style={th}>email</th>
                <th style={th}>role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={td}>{u.id}</td>
                  <td style={td}>{u.username}</td>
                  <td style={td}>{u.email}</td>
                  <td style={td}>{roleLabel(u.role)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'properties' && propertiesPage && (
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-muted, #f5f7fb)' }}>
                <th style={th}>ID</th>
                <th style={th}>제목</th>
                <th style={th}>가격(만원)</th>
                <th style={th}>상태</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {propertiesPage.content.map((p) => (
                <tr key={p.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={td}>{p.id}</td>
                  <td style={td}><Link to={`/properties/${p.id}`}>{p.title}</Link></td>
                  <td style={td}>{p.price.toLocaleString()}</td>
                  <td style={td}>{p.isSold ? '거래완료' : '판매중'}</td>
                  <td style={td}>
                    <button type="button" className="ghost" onClick={() => handleDelete(p.id!)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', alignItems: 'center' }}>
            <span className="subtle" style={{ fontSize: '0.8rem' }}>
              총 {propertiesPage.totalElements}건 · {propertiesPage.number + 1} / {Math.max(propertiesPage.totalPages, 1)} 페이지
            </span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button type="button" className="ghost" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>← 이전</button>
              <button type="button" className="ghost" disabled={page + 1 >= propertiesPage.totalPages} onClick={() => setPage((p) => p + 1)}>다음 →</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'transactions' && transactions && (
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-muted, #f5f7fb)' }}>
                <th style={th}>ID</th>
                <th style={th}>매물</th>
                <th style={th}>구매자</th>
                <th style={th}>판매자</th>
                <th style={th}>상태</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={td}>{t.id}</td>
                  <td style={td}>{t.property?.id ? <Link to={`/properties/${t.property.id}`}>#{t.property.id}</Link> : '-'}</td>
                  <td style={td}>{t.buyer?.username ?? '-'}</td>
                  <td style={td}>{t.seller?.username ?? '-'}</td>
                  <td style={td}>{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const th: React.CSSProperties = { textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600 };
const td: React.CSSProperties = { padding: '0.5rem 0.75rem' };

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? 'primary' : 'ghost'}
      style={{ padding: '0.4rem 0.9rem' }}
    >
      {children}
    </button>
  );
}

function SummaryCell({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{value}</div>
      <div className="subtle" style={{ fontSize: '0.8rem' }}>{label}</div>
    </div>
  );
}

export default AdminPage;
