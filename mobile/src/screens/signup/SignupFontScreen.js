// src/screens/signup/SignupFontScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import Header from './_parts/Header';
import PrimaryButton from './_parts/PrimaryButton';
import { useSignup } from './SignupContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { signupApi } from '../../shared/api/auth'; // 목업/실서버 공용
import { resetTo } from '../../navigation/navigationRef';

export default function SignupFontScreen({ navigation }) {
    const { data, setData } = useSignup();

    const previewText = [
        '안녕하세요! 실버브릿지입니다',
        '오늘 하루도 힘차게 시작해볼까요?',
        '오늘은 병원 없으셨나요?',
        '오후에는 비가 온다고 해요! 나가실 계획이 있으시다면 우산 꼭 챙기세요 ㅎㅎ',
    ];

    // 14px ~ 22px 사이 보간 (0~100)
    const size = 14 + (data.fontScale / 100) * 8;

    const inc = () => setData(s => ({ ...s, fontScale: Math.min(100, s.fontScale + 10) }));
    const dec = () => setData(s => ({ ...s, fontScale: Math.max(0, s.fontScale - 10) }));

    const onStart = async () => {
        try {
            // 회원가입 API 호출 (목업에선 토큰/유저 반환)
            const res = await signupApi({
                name: data.name,
                phone: data.phone,
                password: data.password,
                userType: data.userType,
                region: data.region,
            });

            await AsyncStorage.setItem('ACCESS_TOKEN', res.accessToken);
            await AsyncStorage.setItem('USER_INFO', JSON.stringify(res.user));
            resetTo('Main');


        } catch (e) {
            Alert.alert('가입 실패', e?.response?.data?.message || e?.message || '오류가 발생했습니다.');
        }
    };

    return (
        <View className="flex-1 bg-white">
            <Header title="글자크기" />

            <View className="px-6 pt-6">
                {/* 말풍선 미리보기 영역 */}
                <View className="rounded-xl overflow-hidden">
                    <View className="bg-[#D8ECF1] px-4 py-4">
                        {previewText.map((t, i) => (
                            <View key={i} className="self-start bg-white/70 rounded-xl px-3 py-2 mb-2">
                                <Text style={{ fontSize: size }} className="text-gray-800">{t}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* 간이 슬라이더 (– / + 버튼) */}
                <View className="mt-6 px-2">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-gray-500">가</Text>
                        <Text className="text-gray-500">가</Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity className="px-4 py-2 rounded-lg bg-gray-200" onPress={dec}>
                            <Text className="text-gray-800">-</Text>
                        </TouchableOpacity>
                        <Text className="text-gray-600">{Math.round(size)} pt</Text>
                        <TouchableOpacity className="px-4 py-2 rounded-lg bg-gray-200" onPress={inc}>
                            <Text className="text-gray-800">+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <PrimaryButton title="시작하기" onPress={onStart} />
        </View>
    );
}
