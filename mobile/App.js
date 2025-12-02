// mobile/App.js

import 'react-native-gesture-handler'; // 반드시 최상단
import { setupMock } from './src/shared/mocks/setupMock';
import client from './src/shared/api/client';
setupMock(client);

import './global.css';

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/navigation/navigationRef';
import RootNavigator from './src/navigation/RootNavigator';
import { QueryProvider } from './src/app/providers/QueryProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SignupProvider } from './src/screens/signup/SignupContext';

import AlarmWatcher from './src/shared/components/AlarmWatcher';

// ✅ 시스템 알림용
import * as Notifications from 'expo-notifications';

// ✅ 포그라운드일 때도 OS 스타일 알림/소리 나오게 설정
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export default function App() {
    // ✅ 앱 시작 시 알림 권한 요청
    useEffect(() => {
        (async () => {
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== 'granted') {
                await Notifications.requestPermissionsAsync();
            }
        })();
    }, []);

    return (
        <QueryProvider>
            <SignupProvider>
                <SafeAreaProvider>
                    <NavigationContainer ref={navigationRef}>
                        {/* 전역 알람 폴링 (노인/보호자 공통) */}
                        <AlarmWatcher />
                        <RootNavigator />
                    </NavigationContainer>
                </SafeAreaProvider>
            </SignupProvider>
        </QueryProvider>
    );
}
