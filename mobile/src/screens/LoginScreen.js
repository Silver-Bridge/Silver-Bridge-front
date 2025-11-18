// src/screens/LoginScreen.js
import React, { useEffect, useMemo, useState } from 'react';
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

// ✅ expo-auth-session 관련
import * as WebBrowser from 'expo-web-browser';
import {
    makeRedirectUri,
    useAuthRequest,
    ResponseType,
} from 'expo-auth-session';

// ✅ AuthSession에서 브라우저 세션 정리
WebBrowser.maybeCompleteAuthSession();


const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;

// 전화번호 하이픈 포함 포맷 (010-XXXX-XXXX / 02-XXX-XXXX 대응)
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

// ⚠️ RootNavigator의 실제 이름으로 교체 (예: 'Home' 또는 'MainTabs')
const TARGET_ROOT = 'Main';

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

    // =========================
    // ✅ Kakao OAuth 설정 (expo-auth-session)
    // =========================

    // Kakao 인증 엔드포인트
    const kakaoDiscovery = useMemo(
        () => ({
            authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
        }),
        [],
    );

    // Expo가 알아서 exp://... 형태 redirectUri 만들어줌 (Expo Go에서 사용)
    const redirectUri = useMemo(
        () =>
            makeRedirectUri({
                useProxy: true, // Expo Go에서는 true로 두는 게 편함
            }),
        [],
    );

    // Kakao implicit flow (access_token 바로 받는 방식)
    const [kakaoRequest, kakaoResponse, kakaoPromptAsync] = useAuthRequest(
        {
            clientId: KAKAO_REST_API_KEY,
            responseType: ResponseType.Token, // 🔑 access_token 바로 받기
            redirectUri,
        },
        kakaoDiscovery,
    );

    // =========================
    // 일반 로그인
    // =========================
    const onLogin = async () => {
        if (!canSubmit) {
            Alert.alert('확인', '전화번호와 비밀번호를 확인해 주세요.');
            return;
        }
        try {
            setSubmitting(true);

            // 1) 로그인 호출
            const phoneNumber = formatPhoneKR(phoneDigits);
            const res = await loginApi({ phoneNumber, password });

            // 2) 토큰 저장 (응답 헤더/바디에서 가져온 값)
            const accessToken = res?.tokens?.accessToken;
            const refreshToken = res?.tokens?.refreshToken;
            await setAuth({ accessToken, refreshToken });

            // 3) USER_INFO 저장
            //   1순위: 응답 user
            //   2순위: /users/me (loginApi 내부에서 이미 시도했다면 스킵)
            //   3순위: access 토큰 클레임으로 최소 복구
            let user = res?.user;
            if (!user && accessToken && accessToken.split('.').length === 3) {
                const claims = parseJwt(accessToken);
                user = {
                    id: claims?.id ?? claims?.userId ?? claims?.uid ?? claims?.sub,
                    name: claims?.name ?? '사용자',
                    phoneNumber,
                };
            }
            await setUser(normalizeUser(user || { name: '사용자', phoneNumber }));

            // 4) 루트 리셋
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: TARGET_ROOT }],
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

        // (옵션) 저장 보정: USER_INFO.id가 없으면 토큰에서 복구
        try {
            await ensureUserFromToken();
        } catch {}
    };

    // =========================
    // 카카오 로그인 버튼 핸들러
    // =========================
    const onKakaoLogin = async () => {
        if (!kakaoRequest || kakaoSubmitting) return;

        try {
            setKakaoSubmitting(true);
            // 브라우저 열어서 Kakao 로그인 (결과는 kakaoResponse로 들어옴)
            await kakaoPromptAsync({ useProxy: true });
        } catch (e) {
            console.log('[KAKAO LOGIN ERROR promptAsync]', e);
            Alert.alert('오류', '카카오 로그인 도중 오류가 발생했습니다.');
            setKakaoSubmitting(false);
        }
    };

    // =========================
    // 카카오 로그인 결과 처리 (redirect 후 access_token 받아서 백엔드 호출)
    // =========================
    useEffect(() => {
        const handleKakaoResponse = async () => {
            if (!kakaoResponse) return;

            console.log('[KAKAO] kakaoResponse =', kakaoResponse);

            if (kakaoResponse.type !== 'success') {
                if (
                    kakaoResponse.type === 'dismiss' ||
                    kakaoResponse.type === 'cancel'
                ) {
                    Alert.alert('취소', '카카오 로그인이 취소되었습니다.');
                } else {
                    Alert.alert('오류', '카카오 로그인에 실패했습니다.');
                }
                setKakaoSubmitting(false);
                return;
            }

            // implicit flow: #access_token=... 형태로 넘어옴
            const kakaoAccessToken = kakaoResponse.params?.access_token;
            if (!kakaoAccessToken) {
                Alert.alert('오류', '카카오 액세스 토큰을 받지 못했습니다.');
                setKakaoSubmitting(false);
                return;
            }

            try {
                console.log('[KAKAO] accessToken =', kakaoAccessToken);

                // 백엔드 /social/kakao 호출 (accessToken 기반)
                const res = await kakaoSocialLogin(kakaoAccessToken);
                console.log('[KAKAO LOGIN RES]', res);

                try {
                    await ensureUserFromToken();
                } catch {}

                // 메인으로 이동
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: TARGET_ROOT }],
                    }),
                );

                Alert.alert('안내', '카카오 로그인에 성공했습니다.');
            } catch (e) {
                console.log('[KAKAO LOGIN ERROR /social/kakao]', e);
                const msg =
                    e?.response?.data?.message ||
                    e?.message ||
                    '카카오 로그인에 실패했습니다.\n다시 시도해 주세요.';
                Alert.alert('오류', msg);
            } finally {
                setKakaoSubmitting(false);
            }
        };

        handleKakaoResponse();
    }, [kakaoResponse, navigation]);

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
                            onChangeText={setPhone}
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
