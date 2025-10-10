// mobile/App.js (수정된 최종 코드)

import 'react-native-gesture-handler'; // 반드시 최상단
import {setupMock} from './src/shared/mocks/setupMock'
// [수정] AsyncStorage는 이제 사용되지 않으므로 제거
// import AsyncStorage from '@react-native-async-storage/async-storage';
import client from './src/shared/api/client'
setupMock(client);

import './global.css'
// [수정] useEffect와 resetTo가 이제 사용되지 않으므로 제거
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/navigation/navigationRef'; // resetTo는 제거됨
import RootNavigator from './src/navigation/RootNavigator';
import { QueryProvider } from './src/app/providers/QueryProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SignupProvider } from './src/screens/signup/SignupContext';


export default function App() {
    // [수정] 앱 시작 시 토큰 보고 초기 라우트 결정 로직을 제거합니다.
    /*
    useEffect(() => {
        (async () => {
            const token = await AsyncStorage.getItem('ACCESS_TOKEN');
            resetTo(token ? 'Home' : 'Login');
        })();
    }, []);
    */

    return (
        <QueryProvider>
            <SignupProvider>
                <SafeAreaProvider>
                    <NavigationContainer ref={navigationRef}>
                        <RootNavigator />
                    </NavigationContainer>
                </SafeAreaProvider>
            </SignupProvider>
        </QueryProvider>
    );
}