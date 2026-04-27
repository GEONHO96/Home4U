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
import { getSessionUserId, getUnreadCount, listChatRooms, type ChatRoom } from '../api';
import { getBackgroundUnreadState, type BgFetchState } from '../backgroundUnread';
import { useUnread } from '../unreadStore';

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
  const [bgState, setBgState] = useState<BgFetchState | null>(null);
  const unread = useUnread((s) => s.byRoom);
  const setManyUnread = useUnread((s) => s.setMany);

  useEffect(() => {
    getBackgroundUnreadState().then(setBgState).catch(() => setBgState('unsupported'));
  }, []);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const list = await listChatRooms(userId);
      setRooms(list);
      // 각 방의 미읽음 수를 병렬로 조회 — 실패 시 0 으로 유지
      const counts = await Promise.all(
        list.map(async (r) => {
          try { return [r.id, await getUnreadCount(r.id, userId)] as const; }
          catch { return [r.id, 0] as const; }
        }),
      );
      // setMany 가 store 에 반영 + OS 뱃지 자동 동기화까지 처리
      setManyUnread(Object.fromEntries(counts) as Record<number, number>);
    } finally {
      setLoading(false);
    }
  }, [userId, setManyUnread]);

  useEffect(() => {
    load();
    const id = setInterval(load, 15_000); // 15s 폴링 — markRead 즉시 sync 는 store 가 처리
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

  const bgLabel = bgState === 'available' ? '🟢 백그라운드 동기화 ON'
    : bgState === 'restricted' ? '🟡 저전력 모드'
    : bgState === 'denied' ? '🔴 백그라운드 권한 없음'
    : bgState === 'unsupported' ? '— 백그라운드 미지원' : '';

  return (
    <FlatList
      data={rooms}
      keyExtractor={(r) => String(r.id)}
      contentContainerStyle={rooms.length === 0 ? styles.empty : { paddingVertical: 8 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      ListHeaderComponent={
        bgLabel ? <View style={styles.bgRow}><Text style={styles.bgText}>{bgLabel}</Text></View> : null
      }
      ListEmptyComponent={loading ? <ActivityIndicator /> : <Text style={styles.emptyText}>아직 채팅이 없습니다.</Text>}
      renderItem={({ item }) => {
        const peer = item.buyer?.id === userId ? item.seller : item.buyer;
        const u = unread[item.id] ?? 0;
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
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={styles.time}>{formatTime(item.lastMessageAt)}</Text>
              {u > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{u > 99 ? '99+' : u}</Text>
                </View>
              )}
            </View>
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
  unreadBadge: { backgroundColor: '#0e5fe3', borderRadius: 10, minWidth: 20, paddingHorizontal: 6, paddingVertical: 2, alignItems: 'center' },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  bgRow: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#f7f8fa' },
  bgText: { fontSize: 11, color: '#6b7585' },
});
