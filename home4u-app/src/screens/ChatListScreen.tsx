import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { getSessionUserId, listChatRooms, type ChatRoom } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatList'>;

function formatTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default function ChatListScreen({ navigation }: Props) {
  const userId = getSessionUserId();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      setRooms(await listChatRooms(userId));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 15_000); // 15s 폴링
    return () => clearInterval(id);
  }, [load]);

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
      data={rooms}
      keyExtractor={(r) => String(r.id)}
      contentContainerStyle={rooms.length === 0 ? styles.empty : { paddingVertical: 8 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      ListEmptyComponent={loading ? <ActivityIndicator /> : <Text style={styles.emptyText}>아직 채팅이 없습니다.</Text>}
      renderItem={({ item }) => {
        const peer = item.buyer?.id === userId ? item.seller : item.buyer;
        return (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('ChatRoom', { roomId: item.id, peer: peer?.username ?? '상대방' })}
          >
            <View style={styles.avatar}><Text style={styles.avatarText}>{(peer?.username ?? '?').slice(0, 1).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.peer}>{peer?.username ?? '상대방'}</Text>
              {item.property?.title && <Text style={styles.title}>{item.property.title}</Text>}
            </View>
            <Text style={styles.time}>{formatTime(item.lastMessageAt)}</Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyText: { color: '#586069' },
  link: { color: '#0e5fe3', marginTop: 8, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ebedf0' },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#0e5fe3', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700' },
  peer: { fontWeight: '700', fontSize: 15 },
  title: { color: '#586069', marginTop: 2, fontSize: 12 },
  time: { color: '#8b95a1', fontSize: 11 },
});
