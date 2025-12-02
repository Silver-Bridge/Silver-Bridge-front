// src/screens/LoginScreen.js
import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import { login as loginApi, kakaoSocialLogin } from '../shared/api/auth';
import {
    setAuth,
    setUser,
    ensureUserFromToken,
    normalizeUser,
    parseJwt,
} from '../shared/auth/token';

// 🔹 카카오 네이티브 SDK
import { login as kakaoNativeLogin } from '@react-native-seoul/kakao-login';

// .env 에 정의한 Kakao REST API Key (참고용 로그만)
const KAKAO_REST_API_KEY = 'fda22854e56010ae0a8129a6acb4b54d';

// 전화번호 하이픈 포함 포맷
function formatPhoneKR(digits) {
    const d = (digits || '').replace(/\D/g, '');
    if (d.startsWith('02')) {
        if (d.length <= 2) return d;
        if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
        if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
        return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
    }
    if (d.length <= 3) return d;
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
}

export default function LoginScreen({ navigation }) {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [kakaoSubmitting, setKakaoSubmitting] = useState(false);

    const phoneDigits = useMemo(
        () => (phone || '').replace(/\D/g, ''),
        [phone],
    );
    const canSubmit = phoneDigits.length >= 10 && password.length >= 8 && !submitting;

    // 🔹 공통: role 에 따라 메인 스크린 이름 결정
    const getTargetRoot = (role) => {
        return role === 'ROLE_NOK' ? 'GuardianMain' : 'Main';
    };

    // =========================
    // 🔥 일반 로그인: 역할에 따라 분기
    // =========================
    const onLogin = async () => {
        if (!canSubmit) {
            Alert.alert('확인', '전화번호와 비밀번호를 확인해 주세요.');
            return;
        }
        try {
            setSubmitting(true);

            const phoneNumber = formatPhoneKR(phoneDigits);
            const res = await loginApi({ phoneNumber, password });

            const accessToken = res?.tokens?.accessToken;
            const refreshToken = res?.tokens?.refreshToken;
            await setAuth({ accessToken, refreshToken });

            // ✅ 응답에서 user/role/connectedElderId 꺼내기
            let user = res?.user;
            let role = user?.role;
            let connectedElderId = user?.connectedElderId ?? user?.connected_elder_id;

            // 혹시 user 정보가 없으면 토큰에서 꺼내기
            if ((!user || !role) && accessToken && accessToken.split('.').length === 3) {
                const claims = parseJwt(accessToken);

                user = {
                    id: claims?.id ?? claims?.userId ?? claims?.uid ?? claims?.sub,
                    name: claims?.name ?? '사용자',
                    phoneNumber,
                    role: claims?.role || claims?.auth,
                    connectedElderId:
                        claims?.connectedElderId ?? claims?.connected_elder_id ?? null,
                };

                role = user.role;
                connectedElderId = user.connectedElderId;
            }

            console.log('[LOGIN USER]', user);

            await setUser(
                normalizeUser(
                    user || { name: '사용자', phoneNumber, role, connectedElderId },
                ),
            );

            // ✅ 여기서 “최초 진입 화면” 분기
            let firstRoute = 'Main'; // 기본: 노인

            if (role === 'ROLE_NOK') {
                if (connectedElderId) {
                    firstRoute = 'GuardianMain';
                } else {
                    firstRoute = 'GuardianConnect';
                }
            }

            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: firstRoute }],
                }),
            );
        } catch (e) {
            const msg =
                e?.response?.data?.message ||
                e?.__normalized?.message ||
                e?.message ||
                '로그인에 실패했습니다.';
            Alert.alert('로그인 실패', msg);
            setSubmitting(false);
            return;
        }

        try {
            await ensureUserFromToken();
        } catch {}
    };

    // =========================
    // ✅ 카카오 로그인 (네이티브 SDK 사용)
    // =========================
    const onKakaoLogin = async () => {
        if (kakaoSubmitting) return;

        try {
            setKakaoSubmitting(true);

            // 🔹 카카오 네이티브 SDK 로그인
            const token = await kakaoNativeLogin();
            console.log('[KAKAO NATIVE TOKEN]', token);

            const kakaoAccessToken = token?.accessToken;
            if (!kakaoAccessToken) {
                Alert.alert('오류', '카카오 액세스 토큰을 받지 못했습니다.');
                return;
            }

            // 🔹 우리 서버로 소셜 로그인 요청
            const socialResult = await kakaoSocialLogin(kakaoAccessToken);
            console.log('[KAKAO LOGIN RESULT]', socialResult);

            if (socialResult.registered) {
                // ✅ 기존 회원
                const user = socialResult.user;
                const targetRoot = getTargetRoot(user?.role);

                // 토큰/유저 정보가 응답에 있다면 여기서 setAuth, setUser 처리해도 됨
                // (지금 kakaoSocialLogin 응답 구조에 맞게 필요하면 추가)

                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: targetRoot }],
                    }),
                );
                Alert.alert('안내', '카카오 로그인에 성공했습니다.');
            } else {
                // ✅ 신규 회원 – 회원가입 플로우로
                navigation.navigate('Signup', {
                    mode: 'social',
                    tempToken: socialResult.tempToken,
                });
            }
        } catch (e) {
            console.log('[KAKAO LOGIN ERROR]', e);
            const msg =
                e?.response?.data?.message ||
                e?.message ||
                '카카오 로그인에 실패했습니다.\n다시 시도해 주세요.';
            Alert.alert('오류', msg);
        } finally {
            setKakaoSubmitting(false);
        }
    };

    console.log('[KAKAO KEY]', KAKAO_REST_API_KEY);

    // =========================
    // UI
    // =========================
    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    className="flex-1"
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ flexGrow: 1 }}
                >
                    <View className="flex-1 px-6 pt-16 pb-8">
                        {/* 타이틀 */}
                        <View className="mb-10">
                            <Text className="text-[34px] leading-[42px] font-extrabold text-gray-900 mb-3">
                                안녕하세요{'\n'}실버브릿지입니다!
                            </Text>
                            <Text className="text-[13px] text-gray-500">
                                휴대폰 번호로 로그인하고 다양한 기능을 이용해보세요.
                            </Text>
                        </View>

                        {/* 전화번호 */}
                        <TextInput
                            className="border border-gray-300 rounded-2xl px-4 py-4 text-[15px] text-gray-900"
                            placeholder="휴대폰 번호 입력"
                            placeholderTextColor="#A0A0A0"
                            value={phone}
                            onChangeText={(t) => {
                                const digits = (t || '').replace(/\D/g, '');
                                const formatted = formatPhoneKR(digits);
                                setPhone(formatted);
                            }}
                            keyboardType="phone-pad"
                            inputMode="tel"
                            autoComplete="tel"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        {/* 비밀번호 */}
                        <TextInput
                            className="mt-4 border border-gray-300 rounded-2xl px-4 py-4 text-[15px] text-gray-900"
                            placeholder="비밀번호 입력"
                            placeholderTextColor="#A0A0A0"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        {/* 로그인 버튼 */}
                        <TouchableOpacity
                            className={`mt-5 rounded-2xl py-4 items-center ${
                                canSubmit ? 'bg-teal-600' : 'bg-teal-400'
                            }`}
                            disabled={!canSubmit}
                            onPress={onLogin}
                            activeOpacity={0.85}
                        >
                            <Text className="text-white text-base font-bold">
                                {submitting ? '로그인 중…' : '로그인'}
                            </Text>
                        </TouchableOpacity>

                        {/* 링크 */}
                        <View className="mt-5 mb-6 flex-row items-center justify-center">
                            <TouchableOpacity>
                                <Text className="text-[12.5px] text-gray-500">아이디 찾기</Text>
                            </TouchableOpacity>
                            <Text className="mx-3 text-gray-400">|</Text>
                            <TouchableOpacity>
                                <Text className="text-[12.5px] text-gray-500">비밀번호 찾기</Text>
                            </TouchableOpacity>
                            <Text className="mx-3 text-gray-400">|</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                                <Text className="text-[12.5px] font-bold text-teal-600">
                                    회원가입
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* SNS 구분선 */}
                        <View className="my-8 flex-row items-center">
                            <View className="flex-1 h-px bg-gray-200" />
                            <Text className="mx-3 text-xs text-gray-400">
                                SNS 계정으로 로그인
                            </Text>
                            <View className="flex-1 h-px bg-gray-200" />
                        </View>

                        {/* 카카오 */}
                        <TouchableOpacity
                            className="mt-6 mx-6 bg-yellow-300 rounded-xl py-4 items-center justify-center"
                            activeOpacity={0.85}
                            onPress={onKakaoLogin}
                            disabled={kakaoSubmitting}
                        >
                            <Text className="text-[15px] font-semibold text-gray-900">
                                {kakaoSubmitting ? '카카오 로그인 중…' : '카카오로 시작하기'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
