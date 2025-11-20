// src/navigation/CalendarStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CalendarScreen from '../screens/calendar/CalendarScreen';
import ScheduleAddScreen from '../screens/calendar/ScheduleAddScreen';
import ScheduleSearchScreen from '../screens/calendar/ScheduleSearchScreen';
import ScheduleEditScreen from "../screens/calendar/ScheduleEditScreen";

const Stack = createNativeStackNavigator();

export default function CalendarStack() {
    return (
        <Stack.Navigator>
            {/* 메인 달력 화면 */}
            <Stack.Screen
                name="CalendarMain"
                component={CalendarScreen}
                options={{ headerShown: false }}
            />

            {/* 일정 추가 */}
            <Stack.Screen
                name="ScheduleAdd"
                component={ScheduleAddScreen}
                options={{ title: '일정 추가' }}
            />

            {/* 일정 검색 */}
            <Stack.Screen
                name="ScheduleSearch"
                component={ScheduleSearchScreen}
                options={{ title: '일정 검색' }}
            />

            <Stack.Screen
                name="ScheduleEdit"
                component={ScheduleEditScreen}
                options={{ title: '일정 수정' }}
            />

        </Stack.Navigator>
    );
}
