// mobile/src/navigation/GuardianStack.js

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import GuardianCalendarScreen from '../screens/guardian/GuardianCalendarScreen';
import GuardianScheduleAddScreen from '../screens/guardian/GuardianScheduleAddScreen';

const Stack = createNativeStackNavigator();

export default function GuardianStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>

            <Stack.Screen
                name="GuardianCalendar"
                component={GuardianCalendarScreen}
            />

            <Stack.Screen
                name="GuardianScheduleAdd"
                component={GuardianScheduleAddScreen}
            />
        </Stack.Navigator>
    );
}
