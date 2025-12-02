// mobile/src/navigation/GuardianStack.js

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import GuardianCalendarScreen from '../screens/guardian/GuardianCalendarScreen';
import GuardianScheduleAddScreen from '../screens/guardian/GuardianScheduleAddScreen';

const Stack = createNativeStackNavigator();

export default function GuardianStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* 캘린더 메인 */}
            <Stack.Screen
                name="GuardianCalendar"
                component={GuardianCalendarScreen}
            />
            {/* 보호자가 대신 일정 추가 */}
            <Stack.Screen
                name="GuardianScheduleAdd"
                component={GuardianScheduleAddScreen}
            />
        </Stack.Navigator>
    );
}
