import type { ExpoConfig } from 'expo/config';

/**
 * 프로그램형 Expo 설정. app.json 의 정적 값에 더해 dynamic 한 plugin / iOS Info.plist 키 / Android
 * permission 을 추가한다.
 *
 * 적용 plugin
 *  - expo-notifications: 푸시 인텐트 / 채널 / 사운드 (기본값으로 충분)
 *  - expo-background-fetch: iOS Info.plist 의 UIBackgroundModes=fetch 자동 추가
 *  - expo-task-manager: BG fetch 가 의존
 *
 * iOS Info.plist
 *  - NSUserNotificationsUsageDescription / NSAppTransportSecurity
 *
 * Android
 *  - RECEIVE_BOOT_COMPLETED (BG fetch 의 startOnBoot 옵션을 위해 필요)
 *
 * 운영 ENV
 *  - HOME4U_API_BASE_URL: extra.apiBaseUrl 오버라이드 (eas.json secret 으로 주입 가능)
 *  - EAS_BUILD_PROFILE: 'production' | 'preview' | 'development' — production 빌드에서는
 *    NSAppTransportSecurity 의 localhost/10.0.2.2 예외 도메인을 비워 ATS 우회를 차단 (Apple 심사 통과 + 보안 baseline)
 */
const isProductionBuild = process.env.EAS_BUILD_PROFILE === 'production';

/**
 * iOS App Transport Security 설정.
 * - dev/preview: localhost / 10.0.2.2 의 http 만 예외 허용 (개발 편의)
 * - production: 예외 없음 — 모든 외부 호출이 https 여야 한다 (런타임에 http 호출은 OS 차단)
 */
const NSAppTransportSecurity = isProductionBuild
  ? { NSAllowsArbitraryLoads: false }
  : {
      NSAllowsArbitraryLoads: false,
      NSExceptionDomains: {
        localhost: { NSExceptionAllowsInsecureHTTPLoads: true },
        '10.0.2.2': { NSExceptionAllowsInsecureHTTPLoads: true },
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
      NSAppTransportSecurity,
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
    ...(isProductionBuild ? { usesCleartextTraffic: false } : {}),
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
    buildProfile: process.env.EAS_BUILD_PROFILE ?? 'development',
  },
};

export default config;
