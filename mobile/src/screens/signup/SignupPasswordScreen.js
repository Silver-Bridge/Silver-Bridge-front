import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import Header from './_parts/Header';
import PrimaryButton from './_parts/PrimaryButton';
import { useSignup } from './SignupContext';

export default function SignupPasswordScreen({ navigation }) {
    const { data, setData } = useSignup();
    const [pw2, setPw2] = useState('');
    const match = !!data.password && data.password === pw2;
    const canNext = data.password.length >= 4 && match;

    return (
        <View className="flex-1 bg-white">
            <Header title="로그인에 사용할 비밀번호를 입력해주세요" />
            <View className="px-6 pt-6">
                <Text className="mb-2 text-[13px] text-gray-600">비밀번호</Text>
                <TextInput
                    className="mb-4 border border-gray-300 rounded-xl px-4 py-4 text-[15px] text-gray-900"
                    placeholder="비밀번호를 입력해주세요"
                    placeholderTextColor="#A0A0A0"
                    secureTextEntry
                    value={data.password}
                    onChangeText={(t) => setData(s => ({ ...s, password: t }))}
                />
                <Text className="mb-2 text-[13px] text-gray-600">비밀번호 확인</Text>
                <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-4 text-[15px] text-gray-900"
                    placeholder="비밀번호를 한 번 더 입력해주세요"
                    placeholderTextColor="#A0A0A0"
                    secureTextEntry
                    value={pw2}
                    onChangeText={setPw2}
                />
                {!match && pw2.length > 0 && (
                    <Text className="text-[12px] text-red-500 mt-2">비밀번호가 일치하지 않습니다.</Text>
                )}
            </View>
            <PrimaryButton title="다음" onPress={() => navigation.navigate('SignupRegion')} disabled={!canNext} />
        </View>
    );
}
