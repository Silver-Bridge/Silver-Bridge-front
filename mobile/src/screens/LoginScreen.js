// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { loginApi } from '../shared/api/auth';

export default function LoginScreen({ navigation }) {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const onLogin = async () => {
        if (submitting) return;
        try {
            setSubmitting(true);

            // 실제 API 사용 시:
            // const res = await loginApi({ phone, password });
            // await AsyncStorage.setItem('ACCESS_TOKEN', res.accessToken);
            // await AsyncStorage.setItem('USER_INFO', JSON.stringify(res.user));

            // 데모용
            await AsyncStorage.setItem('ACCESS_TOKEN', 'demo-token');
            await AsyncStorage.setItem('USER_INFO', JSON.stringify({ phone }));

            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Main', params: { screen: 'Home' } }],
                })
            );
        } catch (e) {
            console.log('로그인 실패:', e?.response?.data ?? e?.message);
            setSubmitting(false);
        }
    };

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
                    {/* 바깥 여백 넉넉히, 위쪽도 붙지 않게 */}
                    <View className="flex-1 px-6 pt-16 pb-8">
                        {/* 타이틀 블록 */}
                        <View className="mb-10">
                            <Text className="text-[34px] leading-[42px] font-extrabold text-gray-900 mb-3">
                                안녕하세요{'\n'}실버브릿지입니다!
                            </Text>
                            <Text className="text-[13px] text-gray-500">
                                휴대폰 번호로 로그인하고 다양한 기능을 이용해보세요.
                            </Text>
                        </View>

                        {/* 입력/버튼 섹션: 간격 확실히 */}
                        {/* 휴대폰 번호 입력 */}
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

                        {/* 비밀번호 입력 (위 간격) */}
                        <TextInput
                            className="mt-4 border border-gray-300 rounded-2xl px-4 py-4 text-[15px] text-gray-900"
                            placeholder="비밀번호 입력"
                            placeholderTextColor="#A0A0A0"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        {/* 로그인 버튼 (더 넉넉히 띄우기) */}
                        <TouchableOpacity
                            className={`mt-5 rounded-2xl py-4 items-center ${
                                submitting ? 'bg-teal-400' : 'bg-teal-600'
                            }`}
                            disabled={submitting}
                            onPress={onLogin}
                            activeOpacity={0.85}
                        >
                            <Text className="text-white text-base font-bold">
                                {submitting ? '로그인 중…' : '로그인'}
                            </Text>
                        </TouchableOpacity>

                        {/* 링크 섹션 */}
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
                                <Text className="text-[12.5px] font-bold text-teal-600">회원가입</Text>
                            </TouchableOpacity>
                        </View>

                        {/* 구분 라인 */}
                        <View className="my-8 flex-row items-center">
                            <View className="flex-1 h-px bg-gray-200" />
                            <Text className="mx-3 text-xs text-gray-400">SNS 계정으로 로그인</Text>
                            <View className="flex-1 h-px bg-gray-200" />
                        </View>

                        {/* 카카오 로그인 버튼 */}
                        <TouchableOpacity
                            className="mt-2 rounded-2xl py-4 items-center bg-[#FEE500]"
                            activeOpacity={0.9}
                        >
                            <Text className="text-base font-extrabold text-[#3C1E1E]">
                                카카오톡으로 로그인
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
