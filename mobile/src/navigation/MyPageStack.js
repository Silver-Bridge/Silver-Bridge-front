import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MyPageScreen from '../screens/mypage/MyPageScreen';
import RegionSettingScreen from '../screens/mypage/RegionSettingScreen';
import MemberEditScreen from '../screens/mypage/MemberEditScreen';
import FontSettingScreen from '../screens/mypage/FontSettingScreen';
import NotificationSettingScreen from '../screens/mypage/NotificationSettingScreen';

const Stack = createNativeStackNavigator();

/**
 * 마이페이지 탭 내의 모든 화면 이동을 관리하는 스택 네비게이터입니다.
 */
export default function MyPageStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* 마이페이지 탭을 눌렀을 때 가장 먼저 보이는 메인 화면입니다. */}
            <Stack.Screen name="MyPageMain" component={MyPageScreen} />

            {/* MyPageMain 화면에서 이동할 수 있는 상세 설정 화면들입니다. */}
            <Stack.Screen name="RegionSetting" component={RegionSettingScreen} />
            <Stack.Screen name="MemberEdit" component={MemberEditScreen} />
            <Stack.Screen name="FontSetting" component={FontSettingScreen} />
            <Stack.Screen name="NotificationSetting" component={NotificationSettingScreen} />
        </Stack.Navigator>
    );
}
