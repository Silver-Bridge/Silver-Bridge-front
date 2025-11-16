// /src/navigation/ChatStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from '../screens/ChatScreen';
import ChatHistoryScreen from '../screens/ChatHistoryScreen';

const Stack = createNativeStackNavigator();

export default function ChatStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: true,              // ✅ 헤더 표시
                headerTitleAlign: 'left',
            }}
        >
            <Stack.Screen
                name="ChatMain"
                component={ChatScreen}
                options={{ title: '내 스토리' }}  // 기본 타이틀
            />
            <Stack.Screen
                name="대화기록"
                component={ChatHistoryScreen}
                options={{ title: '대화 기록' }}
            />
        </Stack.Navigator>
    );
}
