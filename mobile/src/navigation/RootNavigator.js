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
import NotificationSettingScreen from '../screens/mypage/NotificationSettingScreen';
import AlarmSettingScreen from "../screens/settings/AlarmSettingScreen";

// 🔹 스타트 화면 추가
import StartScreen from '../screens/StartScreen';
import GuardianStack from "./GuardianStack";
import GuardianConnectScreen from "../screens/guardian/GuardianConnectScreen";
// 🚨 ScheduleSearchScreen 임포트 제거됨
import GuardianTabs from './GuardianTabs';
const Stack = createNativeStackNavigator();

export default function RootNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName="Start"   // 🔹 앱 시작 시 Start부터
        >
            {/* 스타트 화면 */}
            <Stack.Screen name="Start" component={StartScreen} />
            {/* 기존 화면 */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupStack}/>
            <Stack.Screen name="Main" component={MainTabs} />


            {/* 🔹 보호자용 메인 */}
            <Stack.Screen name="GuardianMain" component={GuardianTabs} />


            <Stack.Screen name="RegionSetting" component={RegionSettingScreen} />
            <Stack.Screen name="MemberEdit" component={MemberEditScreen} />
            <Stack.Screen name="FontSetting" component={FontSettingScreen} />
            <Stack.Screen name="NotificationSetting" component={NotificationSettingScreen} />
            <Stack.Screen
                name="AlarmSetting"
                component={AlarmSettingScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="GuardianConnect"
                component={GuardianConnectScreen}
            />

            {/* 🚨 ScheduleSearch 경로 등록 제거됨 */}
        </Stack.Navigator>
    );
}