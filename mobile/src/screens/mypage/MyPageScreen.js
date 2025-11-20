// mobile/src/screens/mypage/MyPageScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSignup } from '../signup/SignupContext';

const USER_INFO_KEY = 'USER_INFO';

export default function MyPageScreen() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { data: signupData } = useSignup(); // 🧩 회원가입 직후 바로 들어온 경우 fallback 용

    // USER_INFO 구조 기준으로 state 구성
    const [user, setUser] = useState({
        name: signupData.name || '홍길동',
        phoneNumber: signupData.phone || '010-0000-0000',
        region: signupData.region || '',
        textsize: signupData.textsize || '', // "크게" / "보통" ...
    });

    // 🔹 화면이 포커스될 때마다 AsyncStorage에서 USER_INFO 읽어옴
    useEffect(() => {
        if (!isFocused) return;

        (async () => {
            try {
                const raw = await AsyncStorage.getItem(USER_INFO_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    // USER_INFO = { name, phoneNumber, region, textsize, ... }
                    setUser((prev) => ({
                        ...prev,
                        ...parsed,
                    }));
                } else {
                    // 저장된 USER_INFO 없으면, 회원가입 컨텍스트 값으로 채움
                    setUser((prev) => ({
                        ...prev,
                        name: signupData.name || prev.name,
                        phoneNumber: signupData.phone || prev.phoneNumber,
                        region: signupData.region || prev.region,
                        textsize: signupData.textsize || prev.textsize,
                    }));
                }
            } catch (e) {
                console.log('[MyPage] load USER_INFO error:', e?.message || e);
            }
        })();
    }, [isFocused, signupData]);

    const SettingItem = ({ title, value, onPress }) => (
        <TouchableOpacity
            className="flex-row justify-between items-center py-4 px-6 border-b border-gray-200"
            onPress={onPress}
        >
            <View className="flex-row items-center">
                <Text className="text-[20px] mr-3">
                    {title === '회원 수정' && '👤'}
                    {title === '지역 관리' && '📍'}
                    {title === '알림 설정' && '🔔'}
                    {title === '채팅 글자 크기 설정' && 'Aa'}
                </Text>
                <Text className="text-[16px] text-gray-800">{title}</Text>
            </View>
            <View className="flex-row items-center">
                {value ? (
                    <Text className="text-[16px] text-gray-500 mr-2">
                        {value}
                    </Text>
                ) : null}
                <Text className="text-xl text-gray-500">{'>'}</Text>
            </View>
        </TouchableOpacity>
    );

    // 🔹 로그아웃 (토큰 / 유저정보 삭제 예시)
    const handleLogout = async () => {
        try {
            await AsyncStorage.multiRemove([
                'ACCESS_TOKEN',
                'REFRESH_TOKEN',
                'USER_INFO',
                'FONT_SCALE',
            ]);
            // TODO: 실제 네비게이션 스택 이름에 맞게 수정 (예: 'Login' 또는 'Auth')
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (e) {
            console.log('[MyPage] logout error:', e?.message || e);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1">
                {/* 헤더 */}
                <View className="flex-row items-center justify-between py-4 px-6 border-b border-gray-200">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text className="text-2xl">{'←'}</Text>
                    </TouchableOpacity>
                    <Text className="text-xl font-bold">마이페이지</Text>
                    <TouchableOpacity>
                        <Text className="text-2xl">⚙️</Text>
                    </TouchableOpacity>
                </View>

                {/* 프로필 섹션 */}
                <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
                    <View>
                        <Text className="text-xl font-bold text-gray-900">
                            {user.name}님
                        </Text>
                        <Text className="text-base text-gray-800">
                            오늘도 건강하세요!
                        </Text>
                        <Text className="text-sm text-gray-500 mt-1">
                            {user.phoneNumber}
                        </Text>
                    </View>
                    <Image
                        className="w-16 h-16 rounded-full bg-green-200"
                        source={{ uri: 'https://via.placeholder.com/150' }}
                    />
                </View>

                {/* 보호자 연결 정보 (지금은 더미, 나중에 백엔드 연동 가능) */}
                <View className="p-4 m-4 bg-teal-100 rounded-xl">
                    <Text className="text-center text-gray-700 font-bold">
                        박미미님과 연결되어있어요!
                    </Text>
                    <Text className="text-center text-teal-600 font-bold">
                        010-1234-5678
                    </Text>
                </View>

                {/* 설정 목록 */}
                <View className="flex-1">
                    {/* 회원 정보 수정 */}
                    <SettingItem
                        title="회원 수정"
                        onPress={() => navigation.navigate('MemberEdit')}
                    />

                    {/* 지역 관리 – USER_INFO.region 우선, 없으면 signupData.region */}
                    <SettingItem
                        title="지역 관리"
                        value={user.region || signupData.region || '미설정'}
                        onPress={() => navigation.navigate('RegionSetting')}
                    />

                    {/* 알림 설정 – 추후 실제 값 연동 가능 */}
                    <SettingItem
                        title="알림 설정"
                        value="켜짐"
                        onPress={() => navigation.navigate('NotificationSetting')}
                    />

                    {/* 채팅 글자 크기 설정 – USER_INFO.textsize 사용 */}
                    <SettingItem
                        title="채팅 글자 크기 설정"
                        value={user.textsize || '보통'}
                        onPress={() => navigation.navigate('FontSetting')}
                    />
                </View>

                {/* 로그아웃 버튼 */}
                <TouchableOpacity
                    className="mt-auto mx-4 mb-4 rounded-xl py-4 items-center bg-gray-200"
                    onPress={handleLogout}
                >
                    <Text className="text-gray-700 font-bold">로그아웃</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
