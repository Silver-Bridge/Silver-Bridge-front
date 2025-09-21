import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Header from './_parts/Header';
import PrimaryButton from './_parts/PrimaryButton';
import { useSignup } from './SignupContext';

function Option({ label, selected, onPress, icon }) {
    return (
        <TouchableOpacity onPress={onPress} className="items-center mx-8">
            <Text className="text-5xl mb-2">{icon}</Text>
            <Text className="text-[13px] text-gray-700">{label}</Text>
            <View className={`mt-2 w-6 h-6 rounded-md items-center justify-center ${selected ? 'bg-teal-600' : 'bg-gray-200'}`}>
                <Text className="text-white">{selected ? '✓' : ''}</Text>
            </View>
        </TouchableOpacity>
    );
}

export default function SignupTypeScreen({ navigation }) {
    const { data, setData } = useSignup();

    return (
        <View className="flex-1 bg-white">
            <Header title="회원 유형을 선택해주세요" />
            <View className="px-6 mt-8">
                <View className="flex-row justify-center mt-6">
                    <Option
                        label="보호자"
                        selected={data.userType === 'GUARDIAN'}
                        onPress={() => setData(s => ({ ...s, userType: 'GUARDIAN' }))}
                        icon="👨‍👩‍👧"
                    />
                    <Option
                        label="이용자"
                        selected={data.userType === 'USER'}
                        onPress={() => setData(s => ({ ...s, userType: 'USER' }))}
                        icon="🧍"
                    />
                </View>
            </View>
            <PrimaryButton title="다음" onPress={() => navigation.navigate('SignupName')} />
        </View>
    );
}
