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
 *  - NSUserNotificationsUsageDescription / NSAppTransportSecurity (개발용 localhost http 허용)
 *
 * Android
 *  - RECEIVE_BOOT_COMPLETED (BG fetch 의 startOnBoot 옵션을 위해 필요)
 *
 * 운영 ENV
 *  - HOME4U_API_BASE_URL: extra.apiBaseUrl 오버라이드 (eas.json secret 으로 주입 가능)
 */
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
      // 개발 빌드에서 http://10.0.2.2:8080 / localhost 호출 허용 — TestFlight/AppStore 빌드는 false 로
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: false,
        NSExceptionDomains: {
          localhost: { NSExceptionAllowsInsecureHTTPLoads: true },
          '10.0.2.2': { NSExceptionAllowsInsecureHTTPLoads: true },
        },
      },
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
  },
};

export default config;
