// mobile/App.js

import 'react-native-gesture-handler';
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

import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export default function App() {
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
                        <AlarmWatcher />
                        <RootNavigator />
                    </NavigationContainer>
                </SafeAreaProvider>
            </SignupProvider>
        </QueryProvider>
    );
}
