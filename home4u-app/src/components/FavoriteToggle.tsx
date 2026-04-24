import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { addFavorite, checkFavorite, getSessionUserId, removeFavorite } from '../api';

interface Props {
  propertyId: number;
  label?: boolean;
}

export default function FavoriteToggle({ propertyId, label = false }: Props) {
  const userId = getSessionUserId();
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!userId) return;
    checkFavorite(userId, propertyId)
      .then((v) => mounted && setActive(v))
      .catch(() => mounted && setActive(false));
    return () => { mounted = false; };
  }, [userId, propertyId]);

  const toggle = async () => {
    if (!userId) {
      Alert.alert('로그인이 필요해요', '로그인 후 찜 기능을 이용할 수 있습니다.');
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
    <TouchableOpacity onPress={toggle} disabled={busy} style={styles.btn} hitSlop={10}>
      <Text style={[styles.heart, active && styles.heartActive]}>
        {active ? '♥' : '♡'}
      </Text>
      {label && <Text style={styles.label}>{active ? '찜함' : '찜하기'}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  heart: { fontSize: 22, color: '#8b95a1' },
  heartActive: { color: '#e02929' },
  label: { color: '#586069', fontSize: 13 },
});
