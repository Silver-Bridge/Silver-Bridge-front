// mobile/src/navigation/GuardianTabs.js

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import BottomTabBar from './_parts/BottomTabBar';
import GuardianHomeScreen from '../screens/guardian/GuardianHomeScreen';
import MyPageScreen from '../screens/mypage/MyPageScreen';
import GuardianStack from './GuardianStack';   // ✅ 추가

const Tab = createBottomTabNavigator();

export default function GuardianTabs() {
    return (
        <Tab.Navigator
            screenOptions={{ headerShown: false }}
            tabBar={(props) => <BottomTabBar {...props} />}
        >
            <Tab.Screen name="홈" component={GuardianHomeScreen} />

            {/* ✅ 캘린더 탭 안에 Stack 넣기 */}
            <Tab.Screen name="캘린더" component={GuardianStack} />

            <Tab.Screen name="마이페이지" component={MyPageScreen} />
        </Tab.Navigator>
    );
}
