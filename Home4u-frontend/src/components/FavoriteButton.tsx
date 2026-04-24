import { useEffect, useState } from 'react';
import { addFavorite, checkFavorite, removeFavorite } from '../api/favoriteApi';

interface Props {
  propertyId: number;
  variant?: 'inline' | 'icon';
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function FavoriteButton({ propertyId, variant = 'inline' }: Props) {
  const userIdRaw = localStorage.getItem('userId');
  const userId = userIdRaw ? Number(userIdRaw) : null;
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!userId) return;
    checkFavorite(userId, propertyId).then(setActive).catch(() => setActive(false));
  }, [userId, propertyId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) {
      alert('로그인 후 이용할 수 있어요.');
      return;
    }
    setBusy(true);
    try {
      if (active) {
        await removeFavorite(userId, propertyId);
        setActive(false);
      } else {
        await addFavorite(userId, propertyId);
        setActive(true);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`fav-btn ${active ? 'active' : ''}`}
      onClick={toggle}
      disabled={busy}
      aria-pressed={active}
      aria-label={active ? '찜 해제' : '찜하기'}
      style={variant === 'icon' ? { padding: '0.35rem', border: 'none', background: 'transparent' } : undefined}
    >
      <Heart filled={active} />
      {variant === 'inline' && <span>{active ? '찜함' : '찜하기'}</span>}
    </button>
  );
}

export default FavoriteButton;
