# Silver Bridge Mobile App
> 지역별 노인 맞춤형 사투리 음성인식 서비스를 제공하는 AI 기반 복지 플랫폼 **Silver Bridge**의 모바일 애플리케이션입니다.

---

# 📚 Table of Contents

1. [프로젝트 구조](#-1-프로젝트-구조)
2. [Navigation & Screens](#-2-navigation--screens)
3. [API & Data Layer](#-3-api--data-layer)
4. [Components & Utils](#-4-components--shared-utils)
5. [Installation](#-5-installation--run)


---

# 📱 프로젝트 개요
Silver Bridge App은 React Native(Expo)로 개발되었으며, **직관적인 터치 인터페이스**와 **음성 대화 기능**을 통해 고령층 사용자가 쉽게 사용할 수 있도록 설계되었습니다.

---

# 📦 기술 스택
### ✨ Core Libraries
- **@react-native-async-storage/async-storage**: `^2.2.0`
- **@react-native-picker/picker**: `^2.11.4`
- **@react-native-seoul/kakao-login**: `^5.4.2`
- **@react-navigation/bottom-tabs**: `^7.4.7`
- **@react-navigation/native**: `^7.1.17`
- **@react-navigation/native-stack**: `^7.3.26`
- **@tanstack/react-query**: `^5.87.4`
- **react**: `19.1.0`
- **react-native**: `0.81.4`
- **react-native-calendars**: `^1.1313.0`
- **react-native-gesture-handler**: `^2.28.0`
- **react-native-reanimated**: `^4.1.0`
- **react-native-safe-area-context**: `^5.6.1`
- **react-native-screens**: `^4.16.0`
- **react-native-svg**: `15.12.1`
- **react-native-worklets**: `^0.5.1`
- **@react-native-async-storage/async-storage**: `^2.2.0`
- **@react-native-picker/picker**: `^2.11.4`
- **@react-native-seoul/kakao-login**: `^5.4.2`
- **react-native**: `0.81.4`
- **react-native-calendars**: `^1.1313.0`
- **react-native-gesture-handler**: `^2.28.0`
- **react-native-reanimated**: `^4.1.0`
- **react-native-safe-area-context**: `^5.6.1`
- **react-native-screens**: `^4.16.0`
- **react-native-svg**: `15.12.1`
- **react-native-worklets**: `^0.5.1`
- **@expo/vector-icons**: `^15.0.2`
- **babel-preset-expo**: `~54.0.0`
- **expo**: `~54.0.6`
- **expo-auth-session**: `~7.0.9`
- **expo-av**: `~16.0.7`
- **expo-linear-gradient**: `~15.0.7`
- **expo-speech**: `~14.0.7`
- **expo-status-bar**: `~3.0.8`
- **expo-web-browser**: `~15.0.9`
- **@react-navigation/native**: `^7.1.17`
- **@react-navigation/native-stack**: `^7.3.26`
- **axios**: `^1.12.2`
- **axios-mock-adapter**: `^2.1.0`
- **@tanstack/react-query**: `^5.87.4`
- **@tanstack/react-query**: `^5.87.4`
- **zustand**: `^5.0.8`
- **nativewind**: `^4.2.0`
- **tailwindcss**: `^3.4.17`

### 📚 Dependencies Summary
- Total Dependencies: 32개


---

# 📁 1. 프로젝트 구조
<pre>
└── 📁 mobile
    ├── 📄 jsconfig.json
    ├── 📄 package.json
    ├── 📁 src
    │   ├── 📁 app
    │   │   ├── 📄 AuthGate.js
    │   │   └── 📁 providers
    │   │       └── 📄 QueryProvider.js
    │   ├── 📁 navigation
    │   │   ├── 📄 CalendarStack.js
    │   │   ├── 📄 ChatStack.js
    │   │   ├── 📄 GuardianStack.js
    │   │   ├── 📄 GuardianTabs.js
    │   │   ├── 📄 MainTabs.js
    │   │   ├── 📄 RootNavigator.js
    │   │   ├── 📄 SignupStack.js
    │   │   ├── 📁 _parts
    │   │   │   └── 📄 BottomTabBar.js
    │   │   └── 📄 navigationRef.js
    │   ├── 📁 screens
    │   │   ├── 📄 ChatHistoryScreen.js
    │   │   ├── 📄 ChatScreen.js
    │   │   ├── 📄 DetailsScreen.js
    │   │   ├── 📄 HomeScreen.js
    │   │   ├── 📄 LoginScreen.js
    │   │   ├── 📄 MyPageScreen.js
    │   │   ├── 📄 StartScreen.js
    │   │   ├── 📄 VoiceChatScreen.js
    │   │   ├── 📁 calendar
    │   │   │   ├── 📄 CalendarScreen.js
    │   │   │   ├── 📄 ScheduleAddScreen.js
    │   │   │   ├── 📄 ScheduleEditScreen.js
    │   │   │   └── 📄 ScheduleSearchScreen.js
    │   │   ├── 📁 guardian
    │   │   │   ├── 📄 GuardianCalendarScreen.js
    │   │   │   ├── 📄 GuardianConnectScreen.js
    │   │   │   └── 📄 GuardianHomeScreen.js
    │   │   ├── 📁 mypage
    │   │   │   ├── 📄 FontSettingScreen.js
    │   │   │   ├── 📄 MemberEditScreen.js
    │   │   │   ├── 📄 MyPageScreen.js
    │   │   │   ├── 📄 NotificationSettingScreen.js
    │   │   │   └── 📄 RegionSettingScreen.js
    │   │   ├── 📁 settings
    │   │   │   └── 📄 AlarmSettingScreen.js
    │   │   └── 📁 signup
    │   │       ├── 📄 SignupContext.js
    │   │       ├── 📄 SignupFontScreen.js
    │   │       ├── 📄 SignupNameScreen.js
    │   │       ├── 📄 SignupPasswordScreen.js
    │   │       ├── 📄 SignupRegionScreen.js
    │   │       ├── 📄 SignupTypeScreen.js
    │   │       ├── 📄 SignupVerifyScreen.js
    │   │       ├── 📄 SignupWrapper.js
    │   │       └── 📁 _parts
    │   │           ├── 📄 Header.js
    │   │           └── 📄 PrimaryButton.js
    │   └── 📁 shared
    │       ├── 📁 api
    │       │   ├── 📄 auth.js
    │       │   ├── 📄 axios.js
    │       │   ├── 📄 calendar.js
    │       │   ├── 📄 chatbot.js
    │       │   ├── 📄 client.js
    │       │   ├── 📄 guardian.js
    │       │   ├── 📄 home.js
    │       │   ├── 📄 meta.js
    │       │   └── 📄 user.js
    │       ├── 📁 auth
    │       │   └── 📄 token.js
    │       ├── 📁 chat
    │       │   ├── 📄 apiStore.js
    │       │   ├── 📄 localStore.js
    │       │   ├── 📄 storeFactory.js
    │       │   └── 📄 types.js
    │       ├── 📁 components
    │       │   └── 📄 AppText.js
    │       ├── 📁 mocks
    │       │   └── 📄 setupMock.js
    │       └── 📁 utils
    │           ├── 📄 fontScaleContext.js
    │           ├── 📄 format.js
    │           ├── 📄 healthcheck.js
    │           ├── 📄 useChatFont.js
    │           └── 📄 userStorage.js
    └── 📄 tailwind.config.js

</pre>

---

# 🗺️ 2. Navigation & Screens
> 앱의 네비게이션 구조와 주요 화면 구성입니다.
### 🧭 Navigation (Stack & Tabs)
- **CalendarStack.js**
- **ChatStack.js**
- **GuardianStack.js**
- **GuardianTabs.js**
- **MainTabs.js**
- **RootNavigator.js**
- **SignupStack.js**
- **navigationRef.js**

### 📱 Screens
- 📄 `MyPageScreen`
- 📄 `HomeScreen`
- 📄 `StartScreen`
- 📄 `ChatHistoryScreen`
- 📄 `LoginScreen`
- 📄 `VoiceChatScreen`
- 📄 `DetailsScreen`
- 📄 `ChatScreen`

**📂 CALENDAR**
- `CalendarScreen`
- `ScheduleAddScreen`
- `ScheduleEditScreen`
- `ScheduleSearchScreen`

**📂 GUARDIAN**
- `GuardianCalendarScreen`
- `GuardianConnectScreen`
- `GuardianHomeScreen`

**📂 MYPAGE**
- `FontSettingScreen`
- `MemberEditScreen`
- `MyPageScreen`
- `NotificationSettingScreen`
- `RegionSettingScreen`

**📂 SETTINGS**
- `AlarmSettingScreen`

**📂 SIGNUP**
- `SignupContext`
- `SignupFontScreen`
- `SignupNameScreen`
- `SignupPasswordScreen`
- `SignupRegionScreen`
- `SignupTypeScreen`
- `SignupVerifyScreen`
- `SignupWrapper`


---

# 📡 3. API & Data Layer
> 백엔드 통신(Axios) 및 데이터 처리 로직입니다.
### 📡 Shared API (`src/shared/api`)
- **auth.js**
- **axios.js**
- **calendar.js**
- **chatbot.js**
- **client.js**
- **guardian.js**
- **home.js**
  - `Functions`: getAssistantSuggestionsApi
- **meta.js**
  - `Functions`: getRegionsApi, getCarriersApi
- **user.js**

### 💾 State & Store (`src/shared/chat`)
- `localStore.js`
- `apiStore.js`
- `storeFactory.js`
- `types.js`


---

# 🧩 4. Components & Shared Utils
> 재사용 가능한 UI 컴포넌트 및 유틸리티입니다.
### 🧩 Shared Components
- `AppText`

### 🧱 Local Parts (Sub-components)
- `src/screens/signup/_parts`
- `src/navigation/_parts`

### 🛠 Utilities
- `format.js`
- `healthcheck.js`
- `fontScaleContext.js`
- `useChatFont.js`
- `userStorage.js`


---

# 🚀 5. Installation & Run
```bash
cd mobile

# 의존성 설치
npm install

# Expo 앱 실행
npx expo start
```

> **Last Updated:** 2025-11-30 11:05:59
