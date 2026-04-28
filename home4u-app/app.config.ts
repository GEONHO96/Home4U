import type { ExpoConfig } from 'expo/config';

/**
 * 프로그램형 Expo 설정.
 *
 * EAS_BUILD_PROFILE 별 분기 (development | preview | production):
 *  - development: 로컬 개발 — localhost / 10.0.2.2 의 http 예외 허용
 *  - preview: TestFlight / 내부 배포 — http 예외는 허용하지만 미디어 도메인은 비차단으로 풀어 외부 이미지 CDN 호환성 확보
 *  - production: 모든 ATS 예외 제거, Android cleartext 차단 — Apple 심사 + 보안 baseline
 *
 * 적용 plugin
 *  - expo-notifications / expo-background-fetch / expo-task-manager
 */
type BuildProfile = 'development' | 'preview' | 'production';

const profile: BuildProfile =
  (process.env.EAS_BUILD_PROFILE as BuildProfile) ?? 'development';

interface AtsExceptionDomain {
  NSExceptionAllowsInsecureHTTPLoads?: boolean;
  NSIncludesSubdomains?: boolean;
}

interface AtsConfig {
  NSAllowsArbitraryLoads?: boolean;
  NSAllowsArbitraryLoadsForMedia?: boolean;
  NSExceptionDomains?: Record<string, AtsExceptionDomain>;
}

/** 빌드 프로파일별 iOS App Transport Security 정책. */
const ATS_BY_PROFILE: Record<BuildProfile, AtsConfig> = {
  development: {
    NSAllowsArbitraryLoads: false,
    NSExceptionDomains: {
      localhost: { NSExceptionAllowsInsecureHTTPLoads: true },
      '10.0.2.2': { NSExceptionAllowsInsecureHTTPLoads: true },
    },
  },
  preview: {
    NSAllowsArbitraryLoads: false,
    // CDN/Unsplash 등 외부 이미지가 http 폴백을 줄 수 있어 미디어만 우회 허용
    NSAllowsArbitraryLoadsForMedia: true,
    NSExceptionDomains: {
      localhost: { NSExceptionAllowsInsecureHTTPLoads: true },
    },
  },
  production: {
    // 어떤 도메인도 http 예외 X — 모든 호출이 https 여야 한다
    NSAllowsArbitraryLoads: false,
  },
};

const config: ExpoConfig = {
  name: 'Home4U',
  slug: 'home4u-app',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'home4u',
  platforms: ['ios', 'android', 'web'],
  icon: './assets/icon.png',
  splash: {
    image: './assets/icon.png',
    resizeMode: 'contain',
    backgroundColor: '#1673ff',
  },
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.home4u.app',
    infoPlist: {
      // expo-background-fetch 가 자동으로 fetch 모드를 넣지만 명시 — Apple 심사 단계에서 누락 방지
      UIBackgroundModes: ['fetch', 'remote-notification'],
      // 사용자에게 보이는 알림 권한 사유 (iOS 13+)
      NSUserNotificationsUsageDescription:
        '거래 진행, 새 메시지, 저장된 검색 알림을 받으려면 알림 권한이 필요합니다.',
      NSAppTransportSecurity: ATS_BY_PROFILE[profile],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#1673ff',
    },
    package: 'com.home4u.app',
    // BackgroundFetch 의 startOnBoot 옵션이 작동하려면 RECEIVE_BOOT_COMPLETED 권한 필요
    permissions: ['RECEIVE_BOOT_COMPLETED', 'POST_NOTIFICATIONS'],
    // production 빌드 시 cleartext (http) 트래픽 자동 차단
    ...(profile === 'production' ? { usesCleartextTraffic: false } : {}),
  },
  web: {
    favicon: './assets/icon.png',
  },
  plugins: [
    'expo-notifications',
    'expo-background-fetch',
    'expo-task-manager',
  ],
  extra: {
    apiBaseUrl: process.env.HOME4U_API_BASE_URL ?? 'http://10.0.2.2:8080',
    // EAS build 의 release SHA — sentry/crash 식별용 (선택)
    appRelease: process.env.HOME4U_APP_RELEASE ?? 'dev',
    // 빌드 프로파일 — 런타임에서 디버그용 indicator 로 노출 가능
    buildProfile: profile,
  },
};

export default config;
