import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import {
  confirmPayment,
  createPaymentIntent,
  getMyTransactionsAsBuyer,
  getSessionUserId,
  type Transaction,
} from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'Transactions'>;

const STATUS_LABEL: Record<Transaction['status'], string> = {
  PENDING: '대기',
  APPROVED: '승인',
  REJECTED: '거절',
  COMPLETED: '완료',
};

export default function TransactionsScreen({ navigation }: Props) {
  const userId = getSessionUserId();
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getMyTransactionsAsBuyer(userId);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const onPay = async (tx: Transaction) => {
    if (!userId) return;
    Alert.alert('결제 확인',
      `${tx.property?.title ?? '거래'} #${tx.id} 결제를 진행할까요?\n금액: ${(tx.property?.price ?? 0).toLocaleString()}만원`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '결제하기',
          style: 'default',
          onPress: async () => {
            setBusy(tx.id);
            try {
              const intent = await createPaymentIntent(tx.id);
              await confirmPayment(intent.id, `stub-key-${intent.id}`);
              await load();
            } catch (err) {
              Alert.alert('결제 실패', (err as Error).message ?? '알 수 없는 오류');
            } finally {
              setBusy(null);
            }
          },
        },
      ]);
  };

  if (!userId) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>로그인이 필요합니다.</Text>
        <TouchableOpacity onPress={() => navigation.replace('Login')}><Text style={styles.link}>로그인 페이지로</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(t) => String(t.id)}
      contentContainerStyle={items.length === 0 ? styles.empty : { padding: 12 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      ListEmptyComponent={loading ? <ActivityIndicator /> : <Text style={styles.emptyText}>진행 중인 거래가 없습니다.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.id}>거래 #{item.id}</Text>
            <Text style={[styles.badge, item.status === 'APPROVED' || item.status === 'COMPLETED' ? styles.badgeOk : styles.badgeMuted]}>
              {STATUS_LABEL[item.status]}
            </Text>
          </View>
          <Text style={styles.title}>{item.property?.title ?? '(매물 정보 없음)'}</Text>
          <Text style={styles.sub}>판매자 {item.seller?.username ?? '-'}</Text>
          {item.status === 'APPROVED' && (
            <TouchableOpacity
              style={[styles.payBtn, busy === item.id && { opacity: 0.5 }]}
              onPress={() => onPay(item)}
              disabled={busy === item.id}
            >
              <Text style={styles.payBtnText}>{busy === item.id ? '결제 중…' : '결제하기'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyText: { color: '#586069' },
  link: { color: '#0e5fe3', marginTop: 8, fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#ebedf0' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  id: { fontWeight: '700', fontSize: 14 },
  title: { marginTop: 6, fontSize: 15 },
  sub: { marginTop: 2, color: '#586069', fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, fontSize: 11, fontWeight: '700' },
  badgeOk: { backgroundColor: '#e6f0ff', color: '#0e5fe3' },
  badgeMuted: { backgroundColor: '#f1f3f5', color: '#586069' },
  payBtn: { marginTop: 10, backgroundColor: '#0e5fe3', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  payBtnText: { color: '#fff', fontWeight: '700' },
});
