import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import LoginScreen from '../screens/LoginScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* 항상 두 화면 다 등록 */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Main" component={MainTabs} />
        </Stack.Navigator>
    );
}
