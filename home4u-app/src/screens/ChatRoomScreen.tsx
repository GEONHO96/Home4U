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
import { getSessionUserId, listChatMessages, sendChatMessage, type ChatMessage } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatRoom'>;

/**
 * 5초 폴링 기반 채팅방. 운영 모드에서는 STOMP 클라이언트로 교체 가능.
 */
export default function ChatRoomScreen({ route }: Props) {
  const { roomId } = route.params;
  const userId = getSessionUserId();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const load = useCallback(async () => {
    try {
      const data = await listChatMessages(roomId);
      setMessages(data);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 5_000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
  }, [messages.length]);

  const onSend = async () => {
    const content = draft.trim();
    if (!content || !userId) return;
    setSending(true);
    try {
      await sendChatMessage(roomId, userId, content);
      setDraft('');
      await load();
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
});
