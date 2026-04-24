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
import { formatPriceHuman, getSessionUserId, listMyFavorites, type Favorite } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'Favorites'>;

export default function FavoritesScreen({ navigation }: Props) {
  const userId = getSessionUserId();
  const [items, setItems] = useState<Favorite[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setError(null);
    try {
      setItems(await listMyFavorites(userId));
    } catch (err: unknown) {
      const anyErr = err as { message?: string };
      setError(anyErr.message ?? '찜 목록을 불러오지 못했습니다.');
      setItems([]);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  if (!userId) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 8, fontSize: 16, fontWeight: '700' }}>로그인이 필요해요</Text>
        <Text style={{ color: '#586069' }}>찜 기능은 로그인 후 이용할 수 있습니다.</Text>
      </View>
    );
  }

  if (items === null && !error) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1673ff" /></View>;
  }

  return (
    <FlatList
      data={items ?? []}
      keyExtractor={(f) => String(f.id)}
      contentContainerStyle={{ padding: 12 }}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor="#1673ff" />
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text>아직 찜한 매물이 없습니다.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const p = item.property;
        if (!p) return null;
        return (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.card}
            onPress={() => navigation.navigate('PropertyDetail', { id: p.id })}
          >
            {p.imageUrl ? (
              <Image source={{ uri: p.imageUrl }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbEmpty]}>
                <Text style={{ color: '#8b95a1' }}>No image</Text>
              </View>
            )}
            <View style={{ padding: 12 }}>
              <Text style={styles.price}>{formatPriceHuman(p.price)}</Text>
              <Text style={styles.title}>{p.title}</Text>
              <Text style={styles.addr}>{p.address}</Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden' },
  thumb: { width: '100%', aspectRatio: 16 / 10, backgroundColor: '#eef2f6' },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  price: { fontSize: 20, fontWeight: '800', color: '#111418' },
  title: { marginTop: 2, fontSize: 15, fontWeight: '600' },
  addr: { marginTop: 2, fontSize: 12, color: '#8b95a1' },
});
