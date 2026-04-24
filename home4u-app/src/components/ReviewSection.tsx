import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  createReview,
  deleteReview,
  getAverageRating,
  getReviews,
  getSessionUserId,
  type Review,
} from '../api';

interface Props {
  propertyId: number;
}

function StarRow({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <Text style={{ color: '#d97757', fontSize: 14 }}>
      {'★'.repeat(rounded)}
      <Text style={{ color: '#d1d6db' }}>{'☆'.repeat(5 - rounded)}</Text>
    </Text>
  );
}

export default function ReviewSection({ propertyId }: Props) {
  const myUserId = getSessionUserId();
  const [items, setItems] = useState<Review[] | null>(null);
  const [avg, setAvg] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [list, a] = await Promise.all([getReviews(propertyId), getAverageRating(propertyId)]);
      setItems(list);
      setAvg(a);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '리뷰 로드 실패';
      setError(msg);
      setItems([]);
    }
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async () => {
    if (!myUserId) {
      Alert.alert('로그인이 필요해요');
      return;
    }
    if (!comment.trim()) {
      Alert.alert('리뷰 내용을 입력해주세요.');
      return;
    }
    setBusy(true);
    try {
      await createReview({ propertyId, userId: myUserId, rating, comment });
      setComment('');
      setRating(5);
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '리뷰 작성 실패';
      Alert.alert('작성 실패', msg);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: number) => {
    if (!myUserId) return;
    try {
      await deleteReview(id, myUserId);
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '삭제 실패';
      Alert.alert('삭제 실패', msg);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.h2}>리뷰</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        {items === null ? (
          <ActivityIndicator color="#1673ff" />
        ) : items.length === 0 ? (
          <Text style={{ color: '#586069' }}>아직 리뷰가 없습니다.</Text>
        ) : (
          <>
            <StarRow value={avg} />
            <Text style={{ fontWeight: '700', marginLeft: 6 }}>{avg.toFixed(1)}</Text>
            <Text style={{ color: '#8b95a1', marginLeft: 4 }}>({items.length}개)</Text>
          </>
        )}
      </View>

      {error && <Text style={{ color: '#c03a3a', marginBottom: 6 }}>{error}</Text>}

      {myUserId && (
        <View style={styles.form}>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setRating(n)} style={styles.starBtn}>
                <Text style={{ fontSize: 22, color: n <= rating ? '#d97757' : '#d1d6db' }}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="이 매물에 대한 의견을 남겨주세요"
            multiline
          />
          <TouchableOpacity style={[styles.primary, busy && { opacity: 0.6 }]} onPress={onSubmit} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>리뷰 등록</Text>}
          </TouchableOpacity>
        </View>
      )}

      {items && items.map((r) => (
        <View key={r.id} style={styles.item}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <StarRow value={r.rating} />
            <Text style={{ fontWeight: '700', marginLeft: 6 }}>
              {r.user?.username ?? `user#${r.user?.id ?? '?'}`}
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={{ color: '#8b95a1', fontSize: 11 }}>
              {new Date(r.createdAt).toLocaleDateString('ko-KR')}
            </Text>
          </View>
          <Text style={{ marginTop: 4, color: '#111418' }}>{r.comment}</Text>
          {myUserId && r.user?.id === myUserId && (
            <TouchableOpacity onPress={() => onDelete(r.id)} style={{ marginTop: 4 }}>
              <Text style={{ color: '#c03a3a', fontSize: 12 }}>내 리뷰 삭제</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { backgroundColor: '#fff', margin: 12, padding: 16, borderRadius: 14 },
  h2: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  form: { marginBottom: 12 },
  starBtn: { paddingHorizontal: 2 },
  input: { borderWidth: 1, borderColor: '#d1d6db', borderRadius: 8, padding: 10, minHeight: 60, textAlignVertical: 'top' },
  primary: { marginTop: 8, backgroundColor: '#1673ff', borderRadius: 8, alignItems: 'center', paddingVertical: 10 },
  primaryText: { color: '#fff', fontWeight: '700' },
  item: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#ebedf0' },
});
