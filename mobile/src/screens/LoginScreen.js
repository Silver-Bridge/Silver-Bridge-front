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
import * as AuthSession from 'expo-auth-session';

// 브라우저 세션 정리 (파일 최상단 쪽에서 한 번만)
WebBrowser.maybeCompleteAuthSession();

// ⚠️ Expo의 공개 환경변수(EXPO_PUBLIC_*)를 권장
// .env에 EXPO_PUBLIC_KAKAO_REST_API_KEY=... 로 저장했다고 가정
const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;

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
    // ✅ Kakao OAuth (access_token 플로우)
    // =========================

    // ⚠️ 지금은 Expo Go 기준으로 proxy 사용
    //    배포 시에는 scheme 기반 redirectUri로 교체 예정 (TODO)
    const redirectUri = useMemo(
        () =>
            AuthSession.makeRedirectUri({
                useProxy: true, // Expo Go에서 auth.expo.io 프록시 사용
                // 배포 시:
                // scheme: 'silverbridge', path: 'kakao-login' 등으로 변경할 예정
            }),
        [],
    );
    console.log('[KAKAO] redirectUri =', redirectUri);

    // access_token 바로 받는 implicit flow
    const kakaoAuthUrl = useMemo(() => {
        const params = new URLSearchParams({
            response_type: 'token', // 🔑 access_token 직접 수신
            client_id: KAKAO_REST_API_KEY,
            redirect_uri: redirectUri,
        }).toString();
        return `https://kauth.kakao.com/oauth/authorize?${params}`;
    }, [redirectUri]);

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

        try {
            await ensureUserFromToken();
        } catch {}
    };

    // =========================
    // 카카오 로그인 (access_token 플로우)
    // =========================
    const onKakaoLogin = async () => {
        if (kakaoSubmitting) return;

        try {
            setKakaoSubmitting(true);

            // 1) 카카오 로그인 페이지 열기
            const result = await AuthSession.startAsync({
                authUrl: kakaoAuthUrl,
            });
            console.log('[KAKAO] AuthSession result =', result);

            if (result.type !== 'success') {
                if (result.type === 'dismiss' || result.type === 'cancel') {
                    Alert.alert('취소', '카카오 로그인이 취소되었습니다.');
                } else {
                    Alert.alert('오류', '카카오 로그인에 실패했습니다.');
                }
                return;
            }

            // 2) implicit flow: #access_token=... 형태로 전달됨
            const kakaoAccessToken = result.params?.access_token;
            if (!kakaoAccessToken) {
                Alert.alert('오류', '카카오 액세스 토큰을 받지 못했습니다.');
                return;
            }

            console.log('[KAKAO] accessToken =', kakaoAccessToken);

            // 3) 백엔드에 accessToken 전달 → 우리 서비스용 JWT 발급
            const res = await kakaoSocialLogin(kakaoAccessToken);
            console.log('[KAKAO LOGIN RES]', res);

            // (옵션) 토큰에서 유저정보 보정
            try {
                await ensureUserFromToken();
            } catch {}

            // 4) 메인으로 이동
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: TARGET_ROOT }],
                }),
            );

            Alert.alert('안내', '카카오 로그인에 성공했습니다.');
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
