// src/navigation/ChatStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from '../screens/ChatScreen';
import ChatHistoryScreen from '../screens/ChatHistoryScreen';

const Stack = createNativeStackNavigator();
export default function ChatStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ChatMain" component={ChatScreen} />
            <Stack.Screen name="대화기록" component={ChatHistoryScreen} />
        </Stack.Navigator>
    );
}
