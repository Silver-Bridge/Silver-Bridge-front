// mobile/src/screens/mypage/MyPageScreen.js

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSignup } from '../signup/SignupContext';

// 🔹 추가: 백엔드 연결 정보 API
import { getElderInfoApi, getGuardianInfoApi } from '../../shared/api/guardian';

const USER_INFO_KEY = 'USER_INFO';

/** 보호자 아바타 선택 */
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
    return require('../../../assets/avatar_elderly_female.png');
};

/** 역할 문자열을 정규화해서 보호자인지 판별 */
const isRoleCaregiver = (roleRaw) => {
    const r = (roleRaw || '').toString().toUpperCase();
    return ['GUARDIAN', 'CARE_GIVER', 'ROLE_GUARDIAN', 'PROTECTOR', 'ROLE_NOK'].includes(r);
};

/** 공용 카드 래퍼 – 패딩/둥근모서리/그림자 통일 */
const Card = ({ children, className = '' }) => (
    <View
        className={`mx-4 mt-4 rounded-2xl bg-white px-5 py-4 ${className}`}
        style={{
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
            elevation: 2,
        }}
    >
        {children}
    </View>
);

/** 공통 설정 아이템 */
const SettingItem = ({ title, value, onPress, iconName }) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="flex-row justify-between items-center py-4 px-5 border-b border-gray-100 bg-white"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
        <View className="flex-row items-center flex-1">
            <Ionicons name={iconName} size={20} color="#4B5563" />
            <Text className="ml-3 text-[17px] text-gray-800" numberOfLines={1}>
                {title}
            </Text>
        </View>
        <View className="flex-row items-center max-w-[45%]">
            {value ? (
                <Text className="text-sm text-gray-500 mr-1" numberOfLines={1}>
                    {value}
                </Text>
            ) : null}
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
        </View>
    </TouchableOpacity>
);

export default function MyPageScreen() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { data: signupData = {} } = useSignup() || {};

    const [user, setUser] = useState({
        name: signupData.name || '홍길동',
        phoneNumber: signupData.phone || '010-0000-0000',
        region: signupData.region || '',
        textsize: signupData.textsize || '',
        role: signupData.role || 'MEMBER',
        gender: signupData.gender || 'UNKNOWN',
        guardianName: signupData.guardianName || '',
        guardianPhone: signupData.guardianPhone || '',
        elderName: signupData.elderName || '',
        elderPhone: signupData.elderPhone || '',
    });

    const isCaregiver = useMemo(
        () => isRoleCaregiver(user.role),
        [user.role],
    );
    const roleLabel = isCaregiver ? '보호자' : '노인 회원';

    const avatarSource = useMemo(
        () =>
            isCaregiver
                ? getGuardianAvatarSource(user.gender)
                : getElderAvatarSource(user.gender),
        [isCaregiver, user.gender],
    );

    useEffect(() => {
        if (!isFocused) return;

        (async () => {
            try {
                const raw = await AsyncStorage.getItem(USER_INFO_KEY);
                let baseUser = { ...user };

                if (raw) {
                    const parsed = JSON.parse(raw);
                    baseUser = {
                        ...baseUser,
                        ...parsed,
                        role: parsed.role || baseUser.role || 'MEMBER',
                        gender: parsed.gender || baseUser.gender || 'UNKNOWN',
                    };
                } else {
                    baseUser = {
                        ...baseUser,
                        name: signupData.name || baseUser.name,
                        phoneNumber: signupData.phone || baseUser.phoneNumber,
                        region: signupData.region || baseUser.region,
                        textsize: signupData.textsize || baseUser.textsize,
                        role: signupData.role || baseUser.role || 'MEMBER',
                        gender: signupData.gender || baseUser.gender || 'UNKNOWN',
                        guardianName: signupData.guardianName || baseUser.guardianName || '',
                        guardianPhone:
                            signupData.guardianPhone || baseUser.guardianPhone || '',
                        elderName: signupData.elderName || baseUser.elderName || '',
                        elderPhone: signupData.elderPhone || baseUser.elderPhone || '',
                    };
                }

                // 1차로 USER_INFO / signup 정보 반영
                setUser(baseUser);

                // 🔹 역할 기준으로 백엔드 연결 정보 가져오기
                const roleForCheck = baseUser.role;
                if (isRoleCaregiver(roleForCheck)) {
                    // 보호자 → 연결된 노인 정보
                    try {
                        const data = await getElderInfoApi();
                        setUser((u) => ({
                            ...u,
                            elderName: data.elderName ?? u.elderName,
                            elderPhone: data.elderPhone ?? u.elderPhone,
                        }));
                    } catch (e) {
                        console.log('[MyPage] getElderInfoApi error:', e?.message || e);
                        // 연결 안 돼있으면 400 + message 내려올 수 있으니 경고만 찍고 넘어가도 됨
                    }
                } else {
                    // 노인 → 연결된 보호자 정보
                    try {
                        const data = await getGuardianInfoApi();
                        setUser((u) => ({
                            ...u,
                            guardianName: data.guardianName ?? u.guardianName,
                            guardianPhone: data.guardianPhone ?? u.guardianPhone,
                        }));
                    } catch (e) {
                        console.log('[MyPage] getGuardianInfoApi error:', e?.message || e);
                    }
                }
            } catch (e) {
                console.log('[MyPage] load USER_INFO error:', e?.message || e);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFocused, signupData]);

    const {
        connectionTitle,
        connectionName,
        connectionPhone,
        connectionSubText,
    } = useMemo(() => {
        if (isCaregiver) {
            const elderName = user.elderName || '연결된 어르신';
            const elderPhone = user.elderPhone || '전화번호 미등록';
            return {
                connectionTitle: '연결된 어르신 정보',
                connectionName: elderName,
                connectionPhone: elderPhone,
                connectionSubText: `${elderName}님과 연결되어 있어요.`,
            };
        } else {
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
            {/* 고정 헤더 */}
            <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center justify-between">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="chevron-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text className="text-lg font-bold">마이페이지</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* 콘텐츠 */}
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 32 }}
                bounces={false}
            >
                <Card>
                    <View className="flex-row items-center">
                        <View className="w-16 h-16 rounded-full bg-white mr-4 items-center justify-center border border-gray-200">
                            <Image
                                source={avatarSource}
                                style={{ width: 54, height: 54 }}
                                resizeMode="contain"
                            />
                        </View>
                        <View className="flex-1">
                            <View className="flex-row items-center justify-between">
                                <Text
                                    className="text-xl font-bold text-gray-900"
                                    numberOfLines={1}
                                >
                                    {user.name}님
                                </Text>
                                <View className="px-2 py-1 rounded-full bg-teal-50">
                                    <Text className="text-xs text-teal-700 font-semibold">
                                        {roleLabel}
                                    </Text>
                                </View>
                            </View>
                            <Text className="text-sm text-gray-600 mt-1" numberOfLines={1}>
                                {user.phoneNumber}
                            </Text>
                            <Text className="text-sm text-gray-500 mt-1">
                                오늘도 건강한 하루 보내세요 😊
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* 연결 정보 카드 */}
                <Card className="bg-[#E0F2F1]">
                    <Text className="text-sm text-teal-800 font-semibold mb-1">
                        {connectionTitle}
                    </Text>
                    <Text className="text-xl text-gray-900 font-bold" numberOfLines={1}>
                        {connectionName}
                    </Text>
                    <Text className="text-lg text-teal-700 mt-1" numberOfLines={1}>
                        {connectionPhone}
                    </Text>
                </Card>

                <Card className="mt-2 p-0">
                    <SettingItem
                        title="회원 정보 수정"
                        onPress={() => navigation.navigate('MemberEdit')}
                        iconName="person-circle-outline"
                    />

                    {!isCaregiver && (
                        <SettingItem
                            title="지역 관리"
                            value={user.region || signupData.region || '미설정'}
                            onPress={() => navigation.navigate('RegionSetting')}
                            iconName="location-outline"
                        />
                    )}

                    <SettingItem
                        title="알림 설정"
                        onPress={() => navigation.navigate('NotificationSetting')}
                        iconName="notifications-outline"
                    />

                    {!isCaregiver && (
                        <SettingItem
                            title="채팅 글자 크기 설정"
                            value={user.textsize || '보통'}
                            onPress={() => navigation.navigate('FontSetting')}
                            iconName="text-outline"
                        />
                    )}
                </Card>

                {/* 로그아웃 버튼 */}
                <TouchableOpacity
                    className="mt-8 mx-4 rounded-xl py-4 items-center bg-white"
                    style={{
                        shadowColor: '#000',
                        shadowOpacity: 0.03,
                        shadowOffset: { width: 0, height: 1 },
                        shadowRadius: 3,
                        elevation: 1,
                    }}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <Text className="text-base text-red-500 font-semibold">
                        로그아웃
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
