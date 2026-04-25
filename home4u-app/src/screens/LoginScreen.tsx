import { useState } from 'react';
import {
  ActivityIndicator,
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
import { getSessionUserId, login } from '../api';
import { usePushRegistration } from '../hooks/usePushRegistration';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 로그인 성공 후 cachedUserId 가 채워지면 토큰 등록 훅이 발사됨
  usePushRegistration(getSessionUserId());

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
      navigation.replace('PropertyList');
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(anyErr.response?.data?.message ?? anyErr.message ?? '로그인 실패');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.hero}>
        <Text style={styles.brand}>Home4U</Text>
        <Text style={styles.sub}>부동산 매물 거래 플랫폼</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>아이디</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="사용자명"
        />

        <Text style={styles.label}>비밀번호</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.primary, busy && { opacity: 0.6 }]}
          onPress={onSubmit}
          disabled={busy}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>로그인</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('PropertyList')} style={styles.ghost}>
          <Text style={styles.ghostText}>로그인 없이 둘러보기</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f8fa', padding: 20, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: 28 },
  brand: { fontSize: 32, fontWeight: '800', color: '#1673ff', letterSpacing: -0.8 },
  sub: { color: '#586069', marginTop: 6 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  label: { color: '#586069', marginTop: 8, marginBottom: 4, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d6db',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111418',
  },
  primary: {
    backgroundColor: '#1673ff',
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 20,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  ghost: { alignItems: 'center', padding: 12, marginTop: 4 },
  ghostText: { color: '#586069' },
  error: { color: '#e02929', marginTop: 8, fontSize: 13 },
});
