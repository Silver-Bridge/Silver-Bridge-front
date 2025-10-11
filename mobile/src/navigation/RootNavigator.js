// mobile/src/navigation/RootNavigator.js (최종 수정 - 스케줄 제거)

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import LoginScreen from '../screens/LoginScreen';
import SignupStack from './SignupStack';

// [필수 추가] MyPage 관련 화면들을 임포트합니다. (screens/mypage 폴더 경로 반영)
import MyPageScreen from '../screens/mypage/MyPageScreen';
import RegionSettingScreen from '../screens/mypage/RegionSettingScreen';
import MemberEditScreen from '../screens/mypage/MemberEditScreen';
import FontSettingScreen from '../screens/mypage/FontSettingScreen';
import NotificationSettingScreen from '../screens/mypage/NotificationSettingScreen'; // ERROR 해결
// 🚨 ScheduleSearchScreen 임포트 제거됨

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* 기존 화면 */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupStack}/>
            <Stack.Screen name="Main" component={MainTabs} />

            {/* [추가] 마이페이지 관련 화면들 (오류 발생 지점) */}
            <Stack.Screen name="MyPage" component={MyPageScreen} />

            {/* ERROR 해결 지점: 모든 하위 설정 경로를 등록합니다. */}
            <Stack.Screen name="RegionSetting" component={RegionSettingScreen} />
            <Stack.Screen name="MemberEdit" component={MemberEditScreen} />
            <Stack.Screen name="FontSetting" component={FontSettingScreen} />
            <Stack.Screen name="NotificationSetting" component={NotificationSettingScreen} />

            {/* 🚨 ScheduleSearch 경로 등록 제거됨 */}
        </Stack.Navigator>
    );
}