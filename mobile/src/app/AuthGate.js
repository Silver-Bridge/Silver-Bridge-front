// src/app/AuthGate.js

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetTo } from '../navigation/navigationRef';
import { getStoredUser } from '../shared/utils/userStorage';

function resolveFirstRoute(user, hasToken) {
    if (!hasToken) return 'Login';

    const role = user?.role;
    const connectedElderId = user?.connectedElderId;

    if (role === 'ROLE_NOK') {
        if (connectedElderId) return 'GuardianMain';
        return 'GuardianConnect';
    }
    return 'Main';
}

export default function AuthGate({ children }) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const run = async () => {
            try {
                const token = await AsyncStorage.getItem('ACCESS_TOKEN');
                const hasToken = !!token;

                // 로그인 상태면 USER_INFO도 같이 읽음
                const user = hasToken ? await getStoredUser() : null;

                const firstRoute = resolveFirstRoute(user, hasToken);
                resetTo(firstRoute);
            } catch (e) {
                console.log('[AuthGate] error', e);
                resetTo('Login');
            } finally {
                setReady(true);
            }
        };

        run();
    }, []);

    if (!ready) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    // AuthGate는 네비게이션만 초기화해주고,
    // 실제 화면은 NavigationContainer 쪽에서 렌더됨
    return children;
}
