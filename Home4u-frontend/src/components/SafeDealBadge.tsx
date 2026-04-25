import { useEffect, useState } from 'react';
import { getRegistry, type RegistryReport } from '../api/registryApi';

interface Props {
  propertyId: number;
}

/**
 * 매물 상세에 띄울 안심거래 배지.
 * /registry/properties/{id} 결과의 `clean` 에 따라 ✓ 또는 ⚠ 색상으로 표시,
 * 클릭 시 상세 (근저당/압류/마스킹된 소유자명/source) 노출.
 */
export default function SafeDealBadge({ propertyId }: Props) {
  const [report, setReport] = useState<RegistryReport | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRegistry(propertyId)
      .then((r) => { if (!cancelled) setReport(r); })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '등기 조회 실패');
      });
    return () => { cancelled = true; };
  }, [propertyId]);

  if (error) return null;
  if (!report) {
    return <span className="badge" style={{ background: '#eef2f7', color: '#6b7280' }}>등기 확인 중…</span>;
  }

  const tone = report.clean ? 'safe' : 'warn';

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.35rem' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="badge"
        style={{
          background: tone === 'safe' ? '#e8f5ee' : '#fff7e6',
          color: tone === 'safe' ? '#0e8a3a' : '#b97400',
          border: 'none',
          cursor: 'pointer',
        }}
        title="등기 검증 결과를 자세히 봅니다"
      >
        {tone === 'safe' ? '✓ 안심거래 가능' : '⚠ 권리관계 확인 필요'}
      </button>
      {open && (
        <div
          style={{
            border: '1px solid var(--color-border)',
            background: '#fff',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '0.55rem 0.7rem',
            fontSize: '0.82rem',
            maxWidth: 320,
          }}
          role="dialog"
        >
          <div><strong>등기 검증</strong> · {report.source === 'stub' ? '로컬 stub' : '등기소 API'}</div>
          {report.ownerNameMasked && <div>소유자: {report.ownerNameMasked}</div>}
          <div>근저당 {report.liens}건 · 압류 {report.seizures}건</div>
          {report.notes && report.notes.length > 0 && (
            <ul style={{ margin: '0.3rem 0 0', paddingLeft: '1rem' }}>
              {report.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
