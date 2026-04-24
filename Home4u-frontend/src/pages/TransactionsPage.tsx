import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  approveTransaction,
  getTransactionsByBuyer,
  getTransactionsBySeller,
  rejectTransaction,
} from '../api/transactionApi';
import { TRANSACTION_STATUSES, type Transaction, type TransactionStatus } from '../types/transaction';

type Tab = 'buyer' | 'seller';

function statusLabel(s: TransactionStatus): string {
  return TRANSACTION_STATUSES.find((x) => x.value === s)?.label ?? s;
}

function statusBadgeClass(s: TransactionStatus): string {
  if (s === 'APPROVED' || s === 'COMPLETED') return 'badge badge-accent';
  if (s === 'REJECTED') return 'badge badge-sold';
  return 'badge';
}

function TransactionsPage() {
  const myUserIdRaw = localStorage.getItem('userId');
  const myUserId = myUserIdRaw ? Number(myUserIdRaw) : null;

  const initialTab: Tab =
    new URLSearchParams(window.location.search).get('tab') === 'seller' ? 'seller' : 'buyer';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [items, setItems] = useState<Transaction[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!myUserId) return;
    setItems(null);
    setError(null);
    try {
      const data = tab === 'buyer'
        ? await getTransactionsByBuyer(myUserId)
        : await getTransactionsBySeller(myUserId);
      setItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '거래 내역을 불러오지 못했습니다.');
      setItems([]);
    }
  }, [tab, myUserId]);

  useEffect(() => { load(); }, [load]);

  if (!myUserId) {
    return (
      <section className="container-narrow" style={{ padding: '2.5rem 1.25rem' }}>
        <h1>내 거래 내역</h1>
        <div className="alert alert-error" role="alert">로그인이 필요합니다.</div>
        <Link to="/login">로그인 페이지로</Link>
      </section>
    );
  }

  const handleApprove = async (txId: number) => {
    setBusyId(txId);
    try {
      await approveTransaction(txId);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '거래 승인 실패');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (txId: number) => {
    setBusyId(txId);
    try {
      await rejectTransaction(txId);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '거래 거절 실패');
    } finally {
      setBusyId(null);
    }
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.5rem 0.95rem',
    borderRadius: 'var(--radius-md)',
    background: active ? 'var(--color-text)' : 'transparent',
    color: active ? 'var(--color-bg-elev)' : 'var(--color-text)',
    border: active ? '1px solid var(--color-text)' : '1px solid var(--color-border)',
    fontWeight: 500,
    cursor: 'pointer',
  });

  return (
    <section className="container-narrow" style={{ padding: '2.25rem 1.25rem 3rem' }}>
      <h1 style={{ marginBottom: '0.3rem' }}>내 거래 내역</h1>
      <p className="muted" style={{ marginBottom: '1.1rem' }}>
        구매자와 판매자 시점을 분리해 진행 중인 거래를 관리합니다.
      </p>

      <div role="tablist" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'buyer'}
          style={tabStyle(tab === 'buyer')}
          onClick={() => setTab('buyer')}
        >
          구매자로서
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'seller'}
          style={tabStyle(tab === 'seller')}
          onClick={() => setTab('seller')}
        >
          판매자로서
        </button>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {items === null && <p className="muted">불러오는 중…</p>}
      {items && items.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          해당 역할로 진행 중인 거래가 없습니다.
        </div>
      )}

      {items && items.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.65rem' }}>
          {items.map((tx) => (
            <li key={tx.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong>거래 #{tx.id}</strong>
                  <span className={statusBadgeClass(tx.status)}>{statusLabel(tx.status)}</span>
                </div>
                <small className="subtle">
                  {tx.date ? new Date(tx.date).toLocaleDateString('ko-KR') : ''}
                </small>
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>
                매물:{' '}
                {tx.property?.id ? (
                  <Link to={`/properties/${tx.property.id}`}>{tx.property.title}</Link>
                ) : (
                  '(매물 정보 없음)'
                )}
              </div>
              <div className="subtle" style={{ marginTop: '0.2rem', fontSize: '0.85rem' }}>
                구매자 {tx.buyer?.username ?? `#${tx.buyer?.id ?? '?'}`} · 판매자 {tx.seller?.username ?? `#${tx.seller?.id ?? '?'}`}
              </div>
              {tab === 'seller' && tx.status === 'PENDING' && (
                <div style={{ marginTop: '0.7rem', display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="accent" onClick={() => handleApprove(tx.id)} disabled={busyId === tx.id}>
                    {busyId === tx.id ? '처리 중…' : '승인'}
                  </button>
                  <button type="button" onClick={() => handleReject(tx.id)} disabled={busyId === tx.id}>
                    거절
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default TransactionsPage;
