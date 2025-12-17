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

    return children;
}
