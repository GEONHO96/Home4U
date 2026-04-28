import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useToast } from '../toastStore';

/**
 * 화면 상단 fade-in/out 글로벌 토스트.
 * NavigationContainer 위쪽 (절대 위치) 에 한 번만 마운트하면 모든 화면에서 동일하게 동작.
 *
 * tone 별 색상:
 *   - info: 회색
 *   - success: 초록
 *   - error: 빨강
 */
const TONE_BG: Record<string, string> = {
  info: '#1f2937',
  success: '#0e8a3a',
  error: '#e02929',
};

export function GlobalToast() {
  const current = useToast((s) => s.current);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (current) {
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    }
  }, [current?.id, opacity]);

  if (!current) return null;

  return (
    <Animated.View
      style={[styles.toast, { backgroundColor: TONE_BG[current.tone] ?? TONE_BG.info, opacity }]}
      pointerEvents="none"
      accessible
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.text}>
        {current.tone === 'error' ? '⚠ ' : current.tone === 'success' ? '✓ ' : ''}
        {current.message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  text: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
