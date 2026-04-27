import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { getSessionUserId, listChatMessages, markRead, sendChatMessage, type ChatMessage } from '../api';
import { connectChat } from '../stomp';
import { useUnread } from '../unreadStore';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatRoom'>;

/**
 * STOMP 실시간 채팅방. WebSocket 연결이 실패하면 5초 폴링으로 자동 fallback.
 */
export default function ChatRoomScreen({ route }: Props) {
  const { roomId } = route.params;
  const userId = getSessionUserId();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [transport, setTransport] = useState<'stomp' | 'polling'>('stomp');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const load = useCallback(async () => {
    try {
      const data = await listChatMessages(roomId);
      setMessages(data);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // 초기 1회 fetch — STOMP/폴링 공통.
  useEffect(() => { load(); }, [load]);

  // 화면 진입 시 미읽음 → 읽음 처리. 새 메시지 도착 후에도 다시 마크 (브로드캐스트 후 자동 호출 X).
  const markReadStore = useUnread((s) => s.markRead);
  useEffect(() => {
    if (!userId) return;
    markRead(roomId, userId)
      .then(() => markReadStore(roomId)) // zustand store → ChatList unread 즉시 0 + OS 뱃지 sync
      .catch(() => { /* 네트워크 실패는 무시 */ });
  }, [roomId, userId, messages.length, markReadStore]);

  // STOMP 우선 — 실패 시 폴링으로 자동 전환.
  const stompRef = useRef<ReturnType<typeof connectChat> | null>(null);
  useEffect(() => {
    let pollId: ReturnType<typeof setInterval> | null = null;

    const fallbackToPolling = () => {
      if (pollId) return;
      setTransport('polling');
      pollId = setInterval(load, 5_000);
    };

    const handle = connectChat(roomId, {
      onConnected: () => setTransport('stomp'),
      onMessage: (raw) => {
        const m = raw as ChatMessage;
        setMessages((prev) => prev.some((p) => p.id === m.id) ? prev : [...prev, m]);
      },
      onError: () => fallbackToPolling(),
      onServerError: (e) => {
        // 서버가 거부한 publish — 사용자에게 안내 (Alert 대신 inline 토스트가 정석이지만 데모용)
        // eslint-disable-next-line no-console
        console.warn('[chat] server rejected publish:', e.message);
      },
    });
    stompRef.current = handle;

    return () => {
      if (pollId) clearInterval(pollId);
      stompRef.current = null;
      handle.close();
    };
  }, [roomId, load]);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
  }, [messages.length]);

  const onSend = async () => {
    const content = draft.trim();
    if (!content || !userId) return;
    setSending(true);
    try {
      // 1) STOMP 가 연결돼 있으면 WS publish — sender 는 JWT 로 식별, payload 에 userId 불필요
      const sentViaStomp = stompRef.current?.publish(content) ?? false;
      if (!sentViaStomp) {
        // 2) STOMP 미연결 시 REST fallback
        await sendChatMessage(roomId, userId, content);
      }
      setDraft('');
      if (transport === 'polling') await load();
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.transportBar}>
        <Text style={styles.transportText}>{transport === 'stomp' ? '🟢 실시간 (STOMP)' : '🟡 폴링 (5s)'}</Text>
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: 12, gap: 6 }}
          renderItem={({ item }) => {
            const mine = item.sender?.id === userId;
            return (
              <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowOther]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                  <Text style={[styles.bubbleText, mine && { color: '#fff' }]}>{item.content}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="메시지 입력"
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!draft.trim() || sending) && { opacity: 0.5 }]}
          onPress={onSend}
          disabled={!draft.trim() || sending}
        >
          <Text style={styles.sendBtnText}>전송</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f8fa' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bubbleRow: { width: '100%' },
  rowMine: { alignItems: 'flex-end' },
  rowOther: { alignItems: 'flex-start' },
  bubble: { maxWidth: '78%', padding: 10, borderRadius: 14 },
  bubbleMine: { backgroundColor: '#0e5fe3' },
  bubbleOther: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ebedf0' },
  bubbleText: { fontSize: 14, color: '#111418' },
  inputRow: { flexDirection: 'row', padding: 8, gap: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#ebedf0' },
  input: { flex: 1, borderWidth: 1, borderColor: '#d1d6db', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111418' },
  sendBtn: { backgroundColor: '#0e5fe3', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontWeight: '700' },
  transportBar: { padding: 6, alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ebedf0' },
  transportText: { fontSize: 11, color: '#6b7585' },
});
