// src/navigation/RootNavigator.js (수정)

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import LoginScreen from '../screens/LoginScreen';
import SignupStack from './SignupStack';

// [마이페이지 화면]: 확장자 없이 모든 화면 임포트
import MyPageScreen from '../screens/mypage/MyPageScreen';
import RegionSettingScreen from '../screens/mypage/RegionSettingScreen';
import MemberEditScreen from '../screens/mypage/MemberEditScreen';
import FontSettingScreen from '../screens/mypage/FontSettingScreen';
// [추가] NotificationSettingScreen 임포트
import NotificationSettingScreen from '../screens/mypage/NotificationSettingScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* 기존 화면 */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupStack}/>
            <Stack.Screen name="Main" component={MainTabs} />

            {/* 마이페이지 관련 화면들 */}
            <Stack.Screen name="MyPage" component={MyPageScreen} />
            <Stack.Screen name="RegionSetting" component={RegionSettingScreen} />
            <Stack.Screen name="MemberEdit" component={MemberEditScreen} />
            <Stack.Screen name="FontSetting" component={FontSettingScreen} />

            {/* [추가/확인] NotificationSetting 경로 등록 */}
            <Stack.Screen name="NotificationSetting" component={NotificationSettingScreen} />
        </Stack.Navigator>
    );
}