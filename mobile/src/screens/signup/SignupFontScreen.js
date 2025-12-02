// src/screens/signup/SignupFontScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import Header from './_parts/Header';
import PrimaryButton from './_parts/PrimaryButton';
import { useSignup } from './SignupContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { join, login, completeSocialRegister } from '../../shared/api/auth';
import { resetTo } from '../../navigation/navigationRef';

// ===== 폰트 5단계 유틸 =====
const FONT_SIZES = [14, 16, 18, 20, 22];
const SIZE_LABELS = ['아주 작게', '조금 작게', '보통', '조금 크게', '크게'];
const UNIT = 100 / (FONT_SIZES.length - 1);
const clamp = (i) => Math.max(0, Math.min(FONT_SIZES.length - 1, i));
const idxFromScale = (s = 0) => clamp(Math.round((s || 0) / UNIT));
const sizeFromIdx = (i) => FONT_SIZES[clamp(i)];
const scaleFromIdx = (i) => clamp(i) * UNIT;

// 전화번호 하이픈 포함
function formatPhoneKR(digits) {
    const d = (digits || '').replace(/\D/g, '');
    if (d.length <= 3) return d;
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
}

// ✅ 주민번호 앞6/뒤1 → 생년월일(YYYY-MM-DD), 성별(Boolean) 계산
function parseBirthAndGender(rrnFront, rrnBack1) {
    const f = (rrnFront || '').replace(/\D/g, '');
    const s = (rrnBack1 || '').replace(/\D/g, '');
    if (!/^\d{6}$/.test(f) || !/^\d$/.test(s)) return null;

    const yy = Number(f.slice(0, 2));
    const mm = f.slice(2, 4);
    const dd = f.slice(4, 6);

    const n = Number(s);
    let century = 1900;
    if ([3, 4, 7, 8].includes(n)) century = 2000;

    const yyyy = String(century + yy);
    const birth = `${yyyy}-${mm}-${dd}`;

    const male = [1, 3, 5, 7].includes(n);
    const gender = male ? true : false;

    return { birth, gender };
}

export default function SignupFontScreen() {
    const { data, setData } = useSignup();
    const [submitting, setSubmitting] = useState(false);

    const isSocial = data.signupMode === 'social'; // ✅ 소셜 여부
    const [currentIndex, setCurrentIndex] = useState(
        idxFromScale(data?.fontScale ?? 0),
    );
    const currentSize = sizeFromIdx(currentIndex);
    const currentLabel = SIZE_LABELS[currentIndex];

    const previewText = [
        '안녕하세요! 실버브릿지입니다',
        '오늘 하루도 힘차게 시작해볼까요?',
        '오늘은 병원 없으셨나요?',
        '오후에는 비가 온다고 해요! 나가실 계획이 있으시다면 우산 꼭 챙기세요 ㅎㅎ',
    ];

    const onStart = async () => {
        if (!data?.verified) {
            return Alert.alert('안내', '휴대폰 인증을 먼저 완료해주세요.');
        }

        if (!data?.role) {
            return Alert.alert(
                '안내',
                '회원 유형 정보가 없습니다. 처음 단계에서 회원 유형을 다시 선택해주세요.',
            );
        }

        // 🔹 공통 필수값 (이름/지역/전화번호)
        if (!data?.name || !data?.region || !data?.phone) {
            return Alert.alert(
                '안내',
                '회원정보가 부족합니다. 이전 단계를 확인해주세요.',
            );
        }

        // 🔹 일반 회원가입일 때만 비밀번호 필수
        if (!isSocial && !data?.password) {
            return Alert.alert('안내', '비밀번호를 입력해주세요.');
        }

        const parsed = parseBirthAndGender(data.rrnFront, data.rrnBack1);
        if (!parsed) {
            return Alert.alert(
                '안내',
                '주민등록번호 정보를 다시 확인해주세요.',
            );
        }
        const { birth, gender } = parsed;

        setSubmitting(true);
        try {
            const fontScale = scaleFromIdx(currentIndex);
            setData((s) => ({ ...s, fontScale }));

            const phoneNumber = formatPhoneKR(data.phone); // 하이픈 포함
            const basePayload = {
                name: data.name.trim(),
                phoneNumber,
                birth,
                gender,
                social: isSocial,      // ✅ basic:false / kakao:true
                region: data.region,
                textsize: currentLabel,
                role: data.role,
            };

            let accessToken, refreshToken, loginUser, resolvedRole, connectedElderId;

            if (isSocial) {
                // 🔥 카카오 소셜 최종가입
                const payload = basePayload; // 소셜 쪽 DTO 규격에 맞다면 그대로 사용
                const res = await completeSocialRegister(
                    data.socialTempToken,
                    payload,
                );

                accessToken = res?.tokens?.accessToken;
                refreshToken = res?.tokens?.refreshToken;
                loginUser = res?.user || {};
                resolvedRole = loginUser.role || data.role;
                connectedElderId =
                    loginUser.connectedElderId ??
                    loginUser.connected_elder_id ??
                    null;
            } else {
                // 🔥 기존 일반 회원가입
                const payload = {
                    ...basePayload,
                    password: data.password,
                };

                // 1) 회원가입
                await join(payload);

                // 2) 자동 로그인
                const loginRes = await login({
                    phoneNumber,
                    password: data.password,
                });

                accessToken = loginRes?.tokens?.accessToken;
                refreshToken = loginRes?.tokens?.refreshToken;
                if (!accessToken) {
                    throw new Error(
                        '토큰을 받을 수 없습니다. 다시 로그인해 주세요.',
                    );
                }

                loginUser = loginRes?.user || {};
                resolvedRole = loginUser.role || data.role;
                connectedElderId =
                    loginUser.connectedElderId ??
                    loginUser.connected_elder_id ??
                    null;
            }

            // 3) 로컬 저장 (공통)
            await AsyncStorage.multiSet([
                ['ACCESS_TOKEN', accessToken || ''],
                ['REFRESH_TOKEN', refreshToken || ''],
                [
                    'USER_INFO',
                    JSON.stringify({
                        name: data.name,
                        phoneNumber: formatPhoneKR(data.phone),
                        region: data.region,
                        gender,
                        birth,
                        textsize: currentLabel,
                        role: resolvedRole,
                        userType: data.userType,
                        connectedElderId: connectedElderId,
                        social: isSocial,
                    }),
                ],
                ['FONT_SCALE', String(fontScale)],
            ]);

            // 4) 홈으로 이동
            let target = 'Main';
            if (resolvedRole === 'ROLE_NOK') {
                target = connectedElderId ? 'GuardianMain' : 'GuardianConnect';
            }

            resetTo(target);
        } catch (e) {
            const msg =
                e?.response?.data?.message ||
                e?.__normalized?.message ||
                e?.message ||
                '회원가입 처리 중 오류가 발생했습니다.';
            Alert.alert('가입 실패', msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <Header title="글자크기" />

            <View className="px-6 pt-6">
                {/* 미리보기 */}
                <View className="rounded-xl overflow-hidden bg-gray-50 p-4 shadow-md">
                    <View className="rounded-xl overflow-hidden">
                        <View className="bg-white px-4 py-4">
                            {previewText.map((t, i) => (
                                <View
                                    key={i}
                                    className={`rounded-xl px-3 py-2 mb-2 ${
                                        i % 2 === 0
                                            ? 'self-start bg-blue-100/70'
                                            : 'self-end bg-gray-200/70'
                                    }`}
                                    style={{ maxWidth: '80%' }}
                                >
                                    <Text
                                        style={{ fontSize: currentSize }}
                                        className="text-gray-800"
                                    >
                                        {t}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                <Text className="text-center text-lg font-bold mt-4 mb-2 text-teal-600">
                    현재 설정: {currentLabel} ({currentSize} pt)
                </Text>

                {/* 5점 슬라이더 */}
                <View className="mt-8 mb-8 px-2">
                    <View className="relative w-full h-4 items-center justify-center">
                        <View
                            className="absolute h-0.5 bg-gray-300 rounded-full"
                            style={{ width: '90%', left: '5%', top: 6 }}
                        />
                        <View className="flex-row w-full h-full items-start justify-between">
                            {FONT_SIZES.map((_, index) => {
                                const isCurrent = index === currentIndex;
                                return (
                                    <View
                                        key={index}
                                        className="flex-1 items-center z-20"
                                    >
                                        <TouchableOpacity
                                            className={`w-4 h-4 rounded-full border-2 ${
                                                isCurrent
                                                    ? 'bg-teal-600 border-teal-600'
                                                    : 'bg-white border-gray-400'
                                            } shadow-sm`}
                                            onPress={() =>
                                                setCurrentIndex(index)
                                            }
                                            activeOpacity={0.8}
                                            disabled={submitting}
                                            style={{
                                                transform: [
                                                    {
                                                        scale: isCurrent
                                                            ? 1.2
                                                            : 1,
                                                    },
                                                ],
                                            }}
                                        />
                                        <Text
                                            className={`text-sm mt-3 ${
                                                isCurrent
                                                    ? 'font-bold text-teal-600'
                                                    : 'text-gray-500'
                                            }`}
                                            style={{ fontSize: 12 }}
                                        >
                                            {SIZE_LABELS[index]}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </View>

            <PrimaryButton
                title={submitting ? '처리 중...' : '시작하기'}
                onPress={onStart}
                disabled={submitting}
            />
        </View>
    );
}
