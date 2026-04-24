import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import {
  formatPriceHuman,
  getProperty,
  getSessionUserId,
  requestTransaction,
  type Property,
} from '../api';
import FavoriteToggle from '../components/FavoriteToggle';
import ReviewSection from '../components/ReviewSection';

type Props = NativeStackScreenProps<RootStackParamList, 'PropertyDetail'>;

export default function PropertyDetailScreen({ route }: Props) {
  const { id } = route.params;
  const [item, setItem] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getProperty(id)
      .then(setItem)
      .catch((err: unknown) => {
        const anyErr = err as { message?: string };
        setError(anyErr.message ?? '매물을 불러오지 못했습니다.');
      });
  }, [id]);

  const onRequestTransaction = async () => {
    if (!item) return;
    const uid = getSessionUserId();
    if (!uid) {
      Alert.alert('로그인이 필요해요', '거래를 요청하려면 먼저 로그인해주세요.');
      return;
    }
    setBusy(true);
    try {
      const tx = await requestTransaction(item.id, uid);
      Alert.alert('거래 요청 완료', `거래 번호 #${tx.id} · 상태 ${tx.status}`);
    } catch (err: unknown) {
      const anyErr = err as { message?: string };
      Alert.alert('거래 요청 실패', anyErr.message ?? '알 수 없는 오류');
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#c03a3a' }}>{error}</Text>
      </View>
    );
  }
  if (!item) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1673ff" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f7f8fa' }}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.heroEmpty]}>
          <Text style={{ color: '#8b95a1' }}>이미지 없음</Text>
        </View>
      )}

      <View style={styles.section}>
        <View style={[styles.badgeRow, { alignItems: 'center' }]}>
          <Badge text={item.propertyType} />
          <Badge text={item.transactionType} accent />
          {item.isSold && <Badge text="거래완료" sold />}
          <View style={{ flex: 1 }} />
          <FavoriteToggle propertyId={item.id} label />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.price}>{formatPriceHuman(item.price)}</Text>
        <Text style={styles.addr}>{item.address}</Text>
        {typeof item.views === 'number' && (
          <Text style={styles.subtle}>조회 {item.views.toLocaleString()}회</Text>
        )}
      </View>

      <View style={styles.section}>
        <SpecRow label="건물 유형" value={item.propertyType} />
        <SpecRow label="거래 유형" value={item.transactionType} />
        <SpecRow label="층수" value={`${item.floor}층`} />
        <SpecRow label="전용면적" value={`${item.minArea}㎡ ~ ${item.maxArea}㎡`} />
        <SpecRow label="설명" value={item.description} />
      </View>

      {!item.isSold && (
        <TouchableOpacity
          style={[styles.cta, busy && { opacity: 0.6 }]}
          onPress={onRequestTransaction}
          disabled={busy}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>거래 요청하기</Text>}
        </TouchableOpacity>
      )}

      <ReviewSection propertyId={item.id} />
    </ScrollView>
  );
}

function Badge({ text, accent, sold }: { text: string; accent?: boolean; sold?: boolean }) {
  return (
    <View
      style={[
        styles.badge,
        accent && { backgroundColor: '#e6f0ff' },
        sold && { backgroundColor: '#fff1f2' },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          accent && { color: '#0e5fe3' },
          sold && { color: '#c03a3a' },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#eef2f6' },
  heroEmpty: { alignItems: 'center', justifyContent: 'center' },
  section: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#f1f3f5', borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#586069' },
  title: { fontSize: 18, fontWeight: '700', color: '#111418' },
  price: { fontSize: 26, fontWeight: '800', color: '#111418', marginTop: 4 },
  addr: { color: '#586069', marginTop: 4 },
  subtle: { color: '#8b95a1', fontSize: 12, marginTop: 4 },
  specRow: { flexDirection: 'row', paddingVertical: 6 },
  specLabel: { width: 80, color: '#586069', fontSize: 13 },
  specValue: { flex: 1, color: '#111418', fontSize: 13 },
  cta: {
    backgroundColor: '#1673ff',
    margin: 12,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
