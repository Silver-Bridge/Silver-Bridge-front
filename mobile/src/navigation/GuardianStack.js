// mobile/src/navigation/GuardianStack.js

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GuardianHomeScreen from '../screens/guardian/GuardianHomeScreen';
import GuardianCalendarScreen from '../screens/guardian/GuardianCalendarScreen';

const Stack = createNativeStackNavigator();

export default function GuardianStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* 메인 홈 화면 */}
            <Stack.Screen
                name="GuardianHome"
                component={GuardianHomeScreen}
            />
            {/* 오늘 일정 전체보기 */}
            <Stack.Screen
                name="GuardianCalendar"
                component={GuardianCalendarScreen}
            />
        </Stack.Navigator>
    );
}
