// mobile/src/screens/mypage/MyPageScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useSignup } from '../signup/SignupContext';

export default function MyPageScreen() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { data: signupData } = useSignup();

    const [user, setUser] = useState({ name: signupData.name || '홍길동', phone: signupData.phone || '010-0000-0000' });

    useEffect(() => {
        // 화면 포커스 시 필요한 데이터 로딩 로직
    }, [isFocused]);

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
                <Text className="text-[16px] text-gray-500 mr-2">{value}</Text>
                <Text className="text-xl text-gray-500">{'>'}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1">
                {/* 헤더 */}
                <View className="flex-row items-center justify-between py-4 px-6 border-b border-gray-200">
                    <TouchableOpacity onPress={() => navigation.goBack()}><Text className="text-2xl">{'←'}</Text></TouchableOpacity>
                    <Text className="text-xl font-bold">마이페이지</Text>
                    <TouchableOpacity><Text className="text-2xl">⚙️</Text></TouchableOpacity>
                </View>

                {/* 프로필 섹션 */}
                <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
                    <View>
                        <Text className="text-xl font-bold text-gray-900">{user.name}님</Text>
                        <Text className="text-base text-gray-800">오늘도 건강하세요!</Text>
                    </View>
                    <Image
                        className="w-16 h-16 rounded-full bg-green-200"
                        source={{ uri: 'https://via.placeholder.com/150' }}
                    />
                </View>

                {/* 보호자 연결 정보 */}
                <View className="p-4 m-4 bg-teal-100 rounded-xl">
                    <Text className="text-center text-gray-700 font-bold">박미미님과 연결되어있어요!</Text>
                    <Text className="text-center text-teal-600 font-bold">010-1234-5678</Text>
                </View>

                {/* 설정 목록 */}
                <View className="flex-1">
                    {/* [수정 확인]: MemberEdit으로 연결 */}
                    <SettingItem
                        title="회원 수정"
                        onPress={() => navigation.navigate('MemberEdit')}
                    />

                    <SettingItem
                        title="지역 관리"
                        value={signupData.region}
                        onPress={() => navigation.navigate('RegionSetting')}
                    />

                    <SettingItem
                        title="알림 설정"
                        value="켜짐"
                        onPress={() => navigation.navigate('NotificationSetting')}
                    />

                    {/* [수정 지점]: FontSetting으로 명시적 연결 */}
                    <SettingItem
                        title="채팅 글자 크기 설정"
                        value="보통"
                        onPress={() => navigation.navigate('FontSetting')}
                    />
                </View>

                {/* 로그아웃 버튼 */}
                <TouchableOpacity
                    className="mt-auto mx-4 mb-4 rounded-xl py-4 items-center bg-gray-200"
                    onPress={() => { /* 로그아웃 로직 */ }}
                >
                    <Text className="text-gray-700 font-bold">로그아웃</Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
}