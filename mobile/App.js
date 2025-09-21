// mobile/App.js
import 'react-native-gesture-handler'; // 반드시 최상단
import {setupMock} from './src/shared/mocks/setupMock'
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from './src/shared/api/client'
setupMock(client);

import './global.css'
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef, resetTo } from './src/navigation/navigationRef';
import RootNavigator from './src/navigation/RootNavigator';
import { QueryProvider } from './src/app/providers/QueryProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
    // 앱 시작 시 토큰 보고 초기 라우트 결정
    useEffect(() => {
        (async () => {
            const token = await AsyncStorage.getItem('ACCESS_TOKEN');
            resetTo(token ? 'Home' : 'Login');
        })();
    }, []);

  return (
      <QueryProvider>
        <SafeAreaProvider>
            <NavigationContainer ref={navigationRef}>
                <RootNavigator />
            </NavigationContainer>
        </SafeAreaProvider>
      </QueryProvider>
  );
}
