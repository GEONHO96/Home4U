import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { formatPriceHuman, listProperties, type Property } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'PropertyList'>;

export default function PropertyListScreen({ navigation }: Props) {
  const [items, setItems] = useState<Property[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await listProperties());
    } catch (err: unknown) {
      const anyErr = err as { response?: { status?: number }; message?: string };
      setError(
        anyErr.response?.status === 403
          ? '로그인이 필요합니다.'
          : anyErr.message ?? '매물을 불러오지 못했습니다.',
      );
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (items === null && !error) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1673ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>불러올 수 없어요</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <TouchableOpacity style={styles.retry} onPress={load}>
          <Text style={styles.retryText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={items ?? []}
      keyExtractor={(p) => String(p.id)}
      contentContainerStyle={{ padding: 12 }}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1673ff" />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text>등록된 매물이 아직 없습니다.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.card}
          onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
        >
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbEmpty]}>
              <Text style={{ color: '#8b95a1' }}>No image</Text>
            </View>
          )}
          <View style={{ padding: 12 }}>
            <View style={styles.badgeRow}>
              <Badge text={item.propertyType} />
              <Badge text={item.transactionType} accent />
              {item.isSold && <Badge text="거래완료" sold />}
            </View>
            <Text style={styles.price}>{formatPriceHuman(item.price)}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.addr}>{item.address}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
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

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  thumb: { width: '100%', aspectRatio: 16 / 10, backgroundColor: '#eef2f6' },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#f1f3f5', borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#586069' },
  price: { fontSize: 20, fontWeight: '800', color: '#111418', letterSpacing: -0.5 },
  title: { marginTop: 2, fontSize: 15, fontWeight: '600', color: '#111418' },
  addr: { marginTop: 2, fontSize: 12, color: '#8b95a1' },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#c03a3a', marginBottom: 4 },
  errorBody: { color: '#586069', marginBottom: 12 },
  retry: { backgroundColor: '#1673ff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700' },
});
