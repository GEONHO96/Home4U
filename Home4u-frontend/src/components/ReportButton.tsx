import { useState } from 'react';
import { fileReport, type ReportTargetType } from '../api/reportApi';

interface Props {
  targetType: ReportTargetType;
  targetId: number;
  label?: string;
  className?: string;
}

/**
 * 매물/리뷰/사용자 옆에 띄울 신고 버튼.
 * 클릭하면 prompt 로 사유를 받고 POST /reports 호출.
 */
export default function ReportButton({ targetType, targetId, label = '🚩 신고', className }: Props) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const myUserIdRaw = localStorage.getItem('userId');
  const myUserId = myUserIdRaw ? Number(myUserIdRaw) : null;

  const onClick = async () => {
    if (!myUserId) {
      alert('로그인이 필요합니다.');
      return;
    }
    const reason = window.prompt(`신고 사유를 입력해주세요. (최대 500자)`, '');
    if (reason == null) return;
    if (!reason.trim()) {
      alert('사유를 입력해주세요.');
      return;
    }
    setBusy(true);
    try {
      await fileReport(myUserId, targetType, targetId, reason.trim());
      setDone(true);
      alert('신고가 접수되었습니다. 검토 후 처리해드립니다.');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '신고 접수 실패';
      alert(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={className ?? 'ghost'}
      onClick={onClick}
      disabled={busy || done}
      style={{ fontSize: '0.8rem', padding: '0.25rem 0.55rem' }}
      title="허위/부적절 콘텐츠를 신고합니다"
    >
      {done ? '신고됨' : busy ? '접수 중…' : label}
    </button>
  );
}
