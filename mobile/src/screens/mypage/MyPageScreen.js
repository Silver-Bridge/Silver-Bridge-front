// mobile/src/screens/mypage/MyPageScreen.js

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSignup } from '../signup/SignupContext';

const USER_INFO_KEY = 'USER_INFO';

/** 보호자 아바타 선택 (GuardianHomeScreen 참고) */
const getGuardianAvatarSource = (genderRaw) => {
    let gender = genderRaw;
    if (typeof genderRaw === 'boolean') {
        gender = genderRaw ? 'male' : 'female';
    }
    const g = (gender || '').toString().toLowerCase();

    if (g === 'm' || g === 'male' || g === '남' || g === '남성' || g === '남자' || g === 'true') {
        return require('../../../assets/avatar_guardian_male.png');
    }
    return require('../../../assets/avatar_guardian_female.png');
};

/** 노인 아바타 선택 */
const getElderAvatarSource = (genderRaw) => {
    let gender = genderRaw;
    if (typeof genderRaw === 'boolean') {
        gender = genderRaw ? 'male' : 'female';
    }
    const g = (gender || '').toString().toLowerCase();

    if (g === 'm' || g === 'male' || g === '남' || g === '남성' || g === '남자') {
        return require('../../../assets/avatar_elderly_male.png');
    }
    // 기본은 노인 여성
    return require('../../../assets/avatar_elderly_female.png');
};

/** 역할 문자열을 정규화해서 보호자인지 판별 */
const isRoleCaregiver = (roleRaw) => {
    const r = (roleRaw || '').toString().toUpperCase();
    // 실제 백엔드에서 쓰는 값들에 맞춰 추가하면 됨
    return ['GUARDIAN', 'CARE_GIVER', 'ROLE_GUARDIAN', 'PROTECTOR','ROLE_NOK'].includes(r);
};

export default function MyPageScreen() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { data: signupData = {} } = useSignup() || {};

    // USER_INFO + role/gender/연결 정보까지 포함
    const [user, setUser] = useState({
        name: signupData.name || '홍길동',
        phoneNumber: signupData.phone || '010-0000-0000',
        region: signupData.region || '',
        textsize: signupData.textsize || '',
        role: signupData.role || 'MEMBER',       // 기본: 노인 회원
        gender: signupData.gender || 'UNKNOWN',  // 기본: UNKNOWN

        guardianName: signupData.guardianName || '',
        guardianPhone: signupData.guardianPhone || '',
        elderName: signupData.elderName || '',
        elderPhone: signupData.elderPhone || '',
    });

    // 보호자 여부
    const isCaregiver = useMemo(
        () => isRoleCaregiver(user.role),
        [user.role],
    );

    // 역할 라벨
    const roleLabel = isCaregiver ? '보호자' : '노인 회원';

    // avatarSource: 보호자이면 보호자 아바타, 아니면 노인 아바타
    const avatarSource = useMemo(
        () =>
            isCaregiver
                ? getGuardianAvatarSource(user.gender)
                : getElderAvatarSource(user.gender),
        [isCaregiver, user.gender],
    );

    // 화면 포커스마다 USER_INFO 동기화
    useEffect(() => {
        if (!isFocused) return;

        (async () => {
            try {
                const raw = await AsyncStorage.getItem(USER_INFO_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    // USER_INFO 에서 필요한 값 머지
                    setUser((prev) => ({
                        ...prev,
                        ...parsed,
                        role: parsed.role || prev.role || 'MEMBER',
                        gender: parsed.gender || prev.gender || 'UNKNOWN',
                    }));
                } else {
                    // 저장된 USER_INFO 없으면 회원가입 컨텍스트 값으로 채움
                    setUser((prev) => ({
                        ...prev,
                        name: signupData.name || prev.name,
                        phoneNumber: signupData.phone || prev.phoneNumber,
                        region: signupData.region || prev.region,
                        textsize: signupData.textsize || prev.textsize,
                        role: signupData.role || prev.role || 'MEMBER',
                        gender: signupData.gender || prev.gender || 'UNKNOWN',
                        guardianName: signupData.guardianName || prev.guardianName || '',
                        guardianPhone:
                            signupData.guardianPhone || prev.guardianPhone || '',
                        elderName: signupData.elderName || prev.elderName || '',
                        elderPhone: signupData.elderPhone || prev.elderPhone || '',
                    }));
                }
            } catch (e) {
                console.log('[MyPage] load USER_INFO error:', e?.message || e);
            }
        })();
    }, [isFocused, signupData]);

    const SettingItem = ({ title, value, onPress }) => (
        <TouchableOpacity
            className="flex-row justify-between items-center py-4 px-6 border-b border-gray-200 bg-white"
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View className="flex-row items-center flex-1">
                <Text className="text-[20px] mr-3">
                    {title === '회원 수정' && '👤'}
                    {title === '지역 관리' && '📍'}
                    {title === '알림 설정' && '🔔'}
                    {title === '채팅 글자 크기 설정' && 'Aa'}
                </Text>
                <Text className="text-base text-gray-800" numberOfLines={1}>
                    {title}
                </Text>
            </View>
            <View className="flex-row items-center max-w-[45%]">
                {value ? (
                    <Text
                        className="text-xs text-gray-500 mr-2"
                        numberOfLines={1}
                    >
                        {value}
                    </Text>
                ) : null}
                <Text className="text-xl text-gray-300">{'>'}</Text>
            </View>
        </TouchableOpacity>
    );

    // 연결 정보 카드용 텍스트 계산
    const {
        connectionTitle,
        connectionName,
        connectionPhone,
        connectionSubText,
    } = useMemo(() => {
        if (isCaregiver) {
            // 보호자라면 → 어르신 정보 표시
            const elderName = user.elderName || '연결된 어르신';
            const elderPhone = user.elderPhone || '전화번호 미등록';
            return {
                connectionTitle: '연결된 어르신 정보',
                connectionName: elderName,
                connectionPhone: elderPhone,
                connectionSubText: `${elderName}님과 연결되어 있어요.`,
            };
        } else {
            // 노인 회원이라면 → 보호자 정보 표시
            const guardianName = user.guardianName || '보호자';
            const guardianPhone = user.guardianPhone || '전화번호 미등록';
            return {
                connectionTitle: '연결된 보호자 정보',
                connectionName: guardianName,
                connectionPhone: guardianPhone,
                connectionSubText: `${guardianName}님이 함께 보고 있어요.`,
            };
        }
    }, [isCaregiver, user.elderName, user.elderPhone, user.guardianName, user.guardianPhone]);

    // 로그아웃
    const handleLogout = async () => {
        try {
            await AsyncStorage.multiRemove([
                'ACCESS_TOKEN',
                'REFRESH_TOKEN',
                'USER_INFO',
                'FONT_SCALE',
            ]);
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (e) {
            console.log('[MyPage] logout error:', e?.message || e);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F5F5F5]">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 32 }}
                bounces={false}
            >
                {/* 헤더 */}
                <View className="flex-row items-center justify-between py-4 px-6 bg-white border-b border-gray-200">
                    <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
                        <Text className="text-2xl">{'←'}</Text>
                    </TouchableOpacity>
                    <Text className="text-lg font-bold">마이페이지</Text>
                    <View style={{ width: 28, alignItems: 'flex-end' }}>
                        <Text className="text-2xl">⚙️</Text>
                    </View>
                </View>

                {/* 프로필 카드 (GuardianHome 스타일 참고) */}
                <View className="mx-4 mt-4 rounded-2xl bg-white shadow-sm flex-row items-center px-5 py-4">
                    <View className="w-14 h-14 rounded-full bg-white mr-4 items-center justify-center border border-gray-200">
                        <Image
                            source={avatarSource}
                            style={{ width: 44, height: 44 }}
                            resizeMode="contain"
                        />
                    </View>
                    <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                            <Text
                                className="text-lg font-bold text-gray-900"
                                numberOfLines={1}
                            >
                                {user.name}님
                            </Text>
                            <View className="px-2 py-1 rounded-full bg-teal-50">
                                <Text className="text-[11px] text-teal-700 font-semibold">
                                    {roleLabel}
                                </Text>
                            </View>
                        </View>
                        <Text className="text-xs text-gray-600 mt-1" numberOfLines={1}>
                            {user.phoneNumber}
                        </Text>
                        <Text className="text-xs text-gray-500 mt-1">
                            오늘도 건강한 하루 보내세요 😊
                        </Text>
                    </View>
                </View>

                {/* 연결 정보 카드 */}
                <View className="mx-4 mt-4 rounded-2xl bg-[#E0F2F1] px-4 py-4">
                    <Text className="text-xs text-teal-800 font-semibold mb-1">
                        {connectionTitle}
                    </Text>
                    <Text className="text-base text-gray-900 font-bold">
                        {connectionName}
                    </Text>
                    <Text className="text-sm text-teal-700 mt-1">
                        {connectionPhone}
                    </Text>
                    <Text className="text-xs text-gray-700 mt-2">
                        {connectionSubText}
                    </Text>
                </View>

                {/* 섹션 타이틀 */}
                <View className="mt-6 mb-1 px-6">
                    <Text className="text-xs text-gray-500">계정 설정</Text>
                </View>

                {/* 설정 목록 카드 */}
                <View className="mx-4 rounded-2xl bg-white overflow-hidden shadow-sm">
                    {/* 회원 정보 수정 */}
                    <SettingItem
                        title="회원 수정"
                        onPress={() => navigation.navigate('MemberEdit')}
                    />

                    {/* 지역 관리 – 보호자는 숨김 */}
                    {!isCaregiver && (
                        <SettingItem
                            title="지역 관리"
                            value={user.region || signupData.region || '미설정'}
                            onPress={() => navigation.navigate('RegionSetting')}
                        />
                    )}

                    {/* 알림 설정 – 공통 */}
                    <SettingItem
                        title="알림 설정"
                        onPress={() => navigation.navigate('NotificationSetting')}
                    />

                    {/* 채팅 글자 크기 설정 – 보호자는 숨김 */}
                    {!isCaregiver && (
                        <SettingItem
                            title="채팅 글자 크기 설정"
                            value={user.textsize || '보통'}
                            onPress={() => navigation.navigate('FontSetting')}
                        />
                    )}
                </View>

                {/* 로그아웃 버튼 */}
                <TouchableOpacity
                    className="mt-6 mx-4 rounded-xl py-4 items-center bg-gray-100"
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <Text className="text-gray-700 font-bold">로그아웃</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
