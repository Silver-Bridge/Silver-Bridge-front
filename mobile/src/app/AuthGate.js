// mobile/src/app/AuthGate.js
import React, { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * AuthGate
 * - 자식(children)을 함수로 받아 { authed } 전달
 * - 화면이 포커스될 때마다 토큰을 재확인하여 최신 인증 상태를 반영
 */
export default function AuthGate({ children }) {
    const [ready, setReady] = useState(false);
    const [authed, setAuthed] = useState(false);

    const checkAuth = useCallback(async () => {
        const token = await AsyncStorage.getItem('ACCESS_TOKEN');
        setAuthed(!!token);
        setReady(true);
    }, []);

    useFocusEffect(
        useCallback(() => {
            setReady(false);
            checkAuth();
        }, [checkAuth])
    );

    if (!ready) {
        return (
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator />
            </View>
        );
    }

    // children을 함수로 받으면 { authed } 제공
    return typeof children === 'function' ? children({ authed }) : children;
}
