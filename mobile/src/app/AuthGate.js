// src/app/AuthGate.js (수정)

import React, { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../shared/api/auth';
import { resetTo } from '../navigation/navigationRef';

export default function AuthGate({ children }) {
    const { isLoggedIn, isLoading } = useAuth();
    const [isReady, setIsReady] = useState(false);

    const checkAuth = useCallback(async () => {
        const token = await AsyncStorage.getItem('ACCESS_TOKEN');
        setAuthed(!!token);

        if (token) {
            // [수정 지점]: 'Home' 대신 탭 네비게이터의 이름인 'Main'으로 리셋합니다.
            resetTo('Main'); // RootNavigator에 등록된 이름은 'Main'입니다.
        } else {
            resetTo('Login');
        }
        setReady(true);
    }, []);

    useFocusEffect(
        useCallback(() => {
            setReady(false);
            checkAuth();
        }, [checkAuth])
    );

    if (isLoading || !isReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return typeof children === 'function' ? children({ authed }) : children;
}