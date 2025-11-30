# Silver Bridge Frontend
> 지역별 노인 맞춤형 사투리 음성인식 서비스를 제공하는 AI 기반 복지 플랫폼 **Silver Bridge**의 사용자 인터페이스(Web/App)입니다.

---

# 📚 Table of Contents

1. [프로젝트 구조](#-1-프로젝트-구조)
2. [Pages & Routes](#-2-pages--routes-summary)
3. [Components](#-3-components-summary)
4. [API & Hooks](#-4-api--hooks-layer)
5. [Installation](#-5-installation--run)


---

# 🚀 프로젝트 개요
Silver Bridge Frontend는 고령층 사용자를 위해 **직관적인 UI/UX**와 **음성 인터페이스**를 중점으로 설계되었습니다.
보호자와 노인 사용자를 위한 맞춤형 화면을 제공하며, 백엔드 API와 실시간으로 통신합니다.

---

# 📦 기술 스택 (Auto-detected)
package.json not found.

---

# 📁 1. 프로젝트 구조
<pre>
└── 📁 mobile
    ├── 📄 App.js
    ├── 📄 app.json
    ├── 📁 assets
    │   ├── 📄 avatar_elderly_female.png
    │   ├── 📄 avatar_elderly_male.png
    │   ├── 📄 avatar_guardian_female.png
    │   ├── 📄 avatar_guardian_male.png
    │   ├── 📄 chungcheong.png
    │   ├── 📄 emotion_0_positive.png
    │   ├── 📄 emotion_1_sadness.png
    │   ├── 📄 emotion_2_anger.png
    │   ├── 📄 emotion_3_anxiety.png
    │   ├── 📄 emotion_4_surprise.png
    │   ├── 📄 emotion_5_disgust.png
    │   ├── 📄 emotion_6_neutral.png
    │   ├── 📄 gyeongsang.png
    │   ├── 📄 jeolla.png
    │   ├── 📄 logo.png
    │   ├── 📄 silvy_loading.gif
    │   └── 📄 start_silbi.png
    ├── 📄 babel.config.js
    ├── 📄 global.css
    ├── 📄 index.js
    ├── 📄 jsconfig.json
    ├── 📄 metro.config.js
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
    │       ├── 📁 assets
    │       │   └── 📄 regionImages.js
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

# 📄 2. Pages & Routes Summary
> 주요 화면(Page) 구성입니다.
No standard page directories found (pages, app, views, screens).

---

# 🧩 3. Components Summary
> 재사용 가능한 UI 컴포넌트 구조입니다.
No 'components' directory found.

---

# 📡 4. API & Hooks Layer
> 백엔드 통신 함수 및 커스텀 훅 요약입니다.
No API or Hooks directories found.

---

# 🛠 5. Installation & Run
```bash
# 의존성 설치
npm install
# or
yarn install

# 개발 서버 실행
npm run dev
# or
yarn dev
```

> **Last Updated:** 2025-11-30 11:03:22
