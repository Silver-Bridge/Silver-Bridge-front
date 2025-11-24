// mobile/src/navigation/GuardianTabs.js

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import BottomTabBar from './_parts/BottomTabBar'; // 노인용과 같은 탭바 재사용
import GuardianHomeScreen from '../screens/guardian/GuardianHomeScreen';
import GuardianCalendarScreen from '../screens/guardian/GuardianCalendarScreen';
import MyPageScreen from '../screens/mypage/MyPageScreen';

const Tab = createBottomTabNavigator();

export default function GuardianTabs() {
    return (
        <Tab.Navigator
            screenOptions={{ headerShown: false }}
            tabBar={(props) => <BottomTabBar {...props} />}
        >
            {/* 탭 이름은 기존 탭바 로직에 맞춰서 사용 */}
            <Tab.Screen name="홈" component={GuardianHomeScreen} />
            <Tab.Screen name="캘린더" component={GuardianCalendarScreen} />
            <Tab.Screen name="마이페이지" component={MyPageScreen} />
        </Tab.Navigator>
    );
}
