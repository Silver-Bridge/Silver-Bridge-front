import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import Header from './_parts/Header';
import PrimaryButton from './_parts/PrimaryButton';
import { useSignup } from './SignupContext';

export default function SignupPasswordScreen({ navigation }) {
    const { data, setData } = useSignup();
    const [pw2, setPw2] = useState('');

    const [hasReachedMinOnce, setHasReachedMinOnce] = useState(false);

    const password = data.password || '';

    // 길이 조건: 8자 이상 20자 이하
    const lengthValid = password.length >= 8 && password.length <= 20;

    // 비밀번호 일치 여부
    const match = password.length > 0 && password === pw2;

    // 다음 버튼 활성화 조건
    const canNext = lengthValid && match;

    // 비밀번호 변경 핸들러
    const handleChangePassword = (t) => {
        setData((s) => ({ ...s, password: t }));

        // 한 번이라도 8자 이상 되면 플래그 ON
        if (t.length >= 8 && !hasReachedMinOnce) {
            setHasReachedMinOnce(true);
        }
    };

    // 길이 안내 메시지: 입력 중(1~7자) + 아직 8자 이상을 한 번도 넘긴 적 없을 때만
    const showLengthHint =
        !hasReachedMinOnce && password.length > 0 && password.length < 8;

    return (
        <View className="flex-1 bg-white">
            <Header title="로그인에 사용할 비밀번호를 입력해주세요" />

            <View className="px-6 pt-6">
                <Text className="mb-2 text-[18px] text-gray-600">비밀번호</Text>
                <TextInput
                    className="mb-2 border border-gray-300 rounded-xl px-4 py-4 text-[16px] text-gray-900"
                    placeholder="비밀번호를 입력해주세요"
                    placeholderTextColor="#A0A0A0"
                    secureTextEntry
                    value={password}
                    onChangeText={handleChangePassword}
                    maxLength={20}
                />

                {showLengthHint && (
                    <Text className="mb-3 text-[13px] text-red-500">
                        비밀번호는 최소 8자 이상, 최대 20자 이하여야 합니다.
                    </Text>
                )}

                <Text className="mb-2 mt-2 text-[18px] text-gray-600">비밀번호 확인</Text>
                <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-4 text-[16px] text-gray-900"
                    placeholder="비밀번호를 한 번 더 입력해주세요"
                    placeholderTextColor="#A0A0A0"
                    secureTextEntry
                    value={pw2}
                    onChangeText={setPw2}
                    maxLength={20}
                />

                {!match && pw2.length > 0 && (
                    <Text className="text-[13px] text-red-500 mt-2">
                        비밀번호가 일치하지 않습니다.
                    </Text>
                )}
            </View>

            <PrimaryButton
                title="다음"
                onPress={() => navigation.navigate('SignupRegion')}
                disabled={!canNext}
            />
        </View>
    );
}
