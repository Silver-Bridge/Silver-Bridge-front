// src/screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetTo } from '../navigation/navigationRef';

export default function HomeScreen() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        (async () => {
            const raw = await AsyncStorage.getItem('USER_INFO');
            if (raw) setUser(JSON.parse(raw));
        })();
    }, []);

    const logout = async () => {
        await AsyncStorage.multiRemove(['ACCESS_TOKEN', 'USER_INFO']);
        resetTo('Login'); // 항상 등록돼 있으므로 정상 작동
    };

    return (
        <View className="flex-1 items-center justify-center px-6">
            <Text className="text-2xl font-bold mb-2">홈</Text>
            {user ? (
                <>
                    <Text className="text-base mb-1">
                        안녕하세요, <Text className="font-bold">{user.name}</Text>님
                    </Text>
                    <Text className="text-base mb-6">전화번호: {user.phone}</Text>
                </>
            ) : (
                <Text className="text-base mb-6">유저 정보를 불러오는 중…</Text>
            )}

            <TouchableOpacity
                className="bg-gray-800 px-4 py-3 rounded-lg"
                onPress={logout}
            >
                <Text className="text-white font-bold">로그아웃</Text>
            </TouchableOpacity>
        </View>
    );
}
