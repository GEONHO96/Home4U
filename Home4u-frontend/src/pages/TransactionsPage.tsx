import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  approveTransaction,
  getTransactionsByBuyer,
  getTransactionsBySeller,
} from '../api/transactionApi';
import { TRANSACTION_STATUSES, type Transaction, type TransactionStatus } from '../types/transaction';

type Tab = 'buyer' | 'seller';

function statusLabel(s: TransactionStatus): string {
  return TRANSACTION_STATUSES.find((x) => x.value === s)?.label ?? s;
}

function TransactionsPage() {
  const myUserIdRaw = localStorage.getItem('userId');
  const myUserId = myUserIdRaw ? Number(myUserIdRaw) : null;

  const [tab, setTab] = useState<Tab>('buyer');
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
      <section>
        <h2>내 거래 내역</h2>
        <p role="alert">로그인이 필요합니다.</p>
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

  return (
    <section>
      <h2>내 거래 내역</h2>

      <div role="tablist" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'buyer'}
          onClick={() => setTab('buyer')}
          style={{ fontWeight: tab === 'buyer' ? 'bold' : 'normal' }}
        >
          구매자로서
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'seller'}
          onClick={() => setTab('seller')}
          style={{ fontWeight: tab === 'seller' ? 'bold' : 'normal' }}
        >
          판매자로서
        </button>
      </div>

      {error && <p role="alert" style={{ color: '#c00' }}>{error}</p>}
      {items === null && <p>불러오는 중…</p>}
      {items && items.length === 0 && <p>해당 역할로 진행 중인 거래가 없습니다.</p>}

      {items && items.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map((tx) => (
            <li key={tx.id} style={{ border: '1px solid #ddd', padding: '0.75rem', marginBottom: '0.5rem', borderRadius: 4 }}>
              <div>
                <strong>거래 #{tx.id}</strong>
                {' · '}
                <span>{statusLabel(tx.status)}</span>
              </div>
              <div style={{ fontSize: '0.9em', marginTop: '0.25rem' }}>
                매물:{' '}
                {tx.property?.id ? (
                  <Link to={`/properties/${tx.property.id}`}>{tx.property.title}</Link>
                ) : (
                  '(매물 정보 없음)'
                )}
              </div>
              <div style={{ fontSize: '0.85em', color: '#555' }}>
                구매자: {tx.buyer?.username ?? `#${tx.buyer?.id ?? '?'}`} ·
                {' '}판매자: {tx.seller?.username ?? `#${tx.seller?.id ?? '?'}`}
              </div>
              {tab === 'seller' && tx.status === 'PENDING' && (
                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleApprove(tx.id)}
                    disabled={busyId === tx.id}
                  >
                    {busyId === tx.id ? '처리 중…' : '승인'}
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
