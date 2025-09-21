import React from 'react';
import { View, TextInput } from 'react-native';
import Header from './_parts/Header';
import PrimaryButton from './_parts/PrimaryButton';
import { useSignup } from './SignupContext';

export default function SignupNameScreen({ navigation }) {
    const { data, setData } = useSignup();
    const canNext = data.name.trim().length >= 2;

    return (
        <View className="flex-1 bg-white">
            <Header title="이름을 적어주세요" />
            <View className="px-6 pt-6">
                <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-4 text-[15px] text-gray-900"
                    placeholder="이름을 입력해주세요"
                    placeholderTextColor="#A0A0A0"
                    value={data.name}
                    onChangeText={(t) => setData(s => ({ ...s, name: t }))}
                />
            </View>
            <PrimaryButton title="다음" onPress={() => navigation.navigate('SignupVerify')} disabled={!canNext} />
        </View>
    );
}
