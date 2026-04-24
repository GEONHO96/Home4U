# Home4U App (Expo · React Native)

Home4U 의 **네이티브 앱** 클라이언트입니다. 기존 Spring Boot 백엔드 (`http://localhost:8080`)
를 그대로 사용합니다.

## 구성

- Expo SDK 52 · React Native 0.76 · TypeScript
- React Navigation (Native Stack)
- Axios

### 화면 3 개 (MVP)
- `Login` — 일반 로그인, "로그인 없이 둘러보기" 옵션
- `PropertyList` — 매물 카드 리스트 (FlatList · Pull-to-refresh · 이미지)
- `PropertyDetail` — 이미지 · 가격 · 사양 · 거래 요청 버튼

## 실행

### 사전 요구
- Node.js 18+
- Android 에뮬레이터 혹은 iOS 시뮬레이터, 또는 실기기에 **Expo Go** 앱 설치

### API Base URL
`app.json` 의 `expo.extra.apiBaseUrl` 로 주입됩니다. 기본값은 Android 에뮬레이터가 호스트를
바라보는 `http://10.0.2.2:8080`. 실기기에서 붙이려면 호스트 머신의 LAN IP 로 바꾸세요.

```jsonc
// app.json
{
  "expo": {
    "extra": { "apiBaseUrl": "http://192.168.0.10:8080" }
  }
}
```

### 실행 명령

```bash
cd home4u-app
npm install
npm start            # Metro 실행, QR 표시
# 그리고 기기 Expo Go 앱으로 QR 스캔

npm run android      # Android 에뮬레이터 기동 시
npm run ios          # Mac 에서 iOS 시뮬레이터 기동 시
npm run web          # 브라우저에서 확인 (제한적)
```

### 네이티브 빌드 (Apple 머신 없이도 가능)

EAS Build 를 사용하면 Windows 에서도 iOS IPA 를 클라우드 빌드 할 수 있습니다.

```bash
npm install -g eas-cli
eas login
eas build --platform android
eas build --platform ios   # Apple 개발자 계정 필요
```

## 구조

```
home4u-app/
├── App.tsx                 # Navigation Container + Stack
├── app.json                # Expo 메타, extra.apiBaseUrl
├── assets/
│   └── icon.png            # 공용 아이콘 (웹 PWA 와 동일)
└── src/
    ├── api.ts              # axios + 백엔드 엔드포인트 + formatPriceHuman
    └── screens/
        ├── LoginScreen.tsx
        ├── PropertyListScreen.tsx
        └── PropertyDetailScreen.tsx
```

## 제한 사항

- 지도 (react-native-maps) 는 의존성이 커서 이번 MVP 에선 제외. 필요 시
  `expo install react-native-maps` 후 `PropertyDetailScreen` 에 `<MapView>` 를 추가.
- 찜/리뷰/거래 거절 등 고급 기능은 웹 버전과 공유하는 백엔드에 이미 존재 — 앱에서는
  점진적으로 추가 예정.
