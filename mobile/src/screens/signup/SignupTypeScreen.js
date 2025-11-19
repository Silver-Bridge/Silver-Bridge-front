import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Header from './_parts/Header';
import PrimaryButton from './_parts/PrimaryButton';
import { useSignup } from './SignupContext';

function Option({ label, selected, onPress, icon }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            className="items-center mx-10 py-4"
        >
            {/* 아이콘 크게 */}
            <Text className="mb-3 text-[56px]">{icon}</Text>

            {/* 라벨 글씨 크게 + 진하게 */}
            <Text className="text-[17px] text-gray-800 font-semibold">
                {label}
            </Text>

            {/* 체크박스 크게 */}
            <View
                className={`mt-3 w-8 h-8 rounded-xl border items-center justify-center ${
                    selected
                        ? 'bg-teal-600 border-teal-600'
                        : 'bg-gray-100 border-gray-300'
                }`}
            >
                {selected ? (
                    <Text className="text-white text-[18px]">✓</Text>
                ) : null}
            </View>
        </TouchableOpacity>
    );
}

export default function SignupTypeScreen({ navigation }) {
    const { data, setData } = useSignup();

    const canNext =
        data.userType === 'GUARDIAN' || data.userType === 'USER';

    return (
        <View className="flex-1 bg-white">
            <Header title="회원 유형을 선택해주세요" />



            <View className="px-6 mt-10">
                <View className="flex-row justify-center">
                    <Option
                        label="보호자"
                        selected={data.userType === 'GUARDIAN'}
                        onPress={() =>
                            setData((s) => ({ ...s, userType: 'GUARDIAN' }))
                        }
                        icon="👨‍👩‍👧"
                    />
                    <Option
                        label="이용자"
                        selected={data.userType === 'USER'}
                        onPress={() =>
                            setData((s) => ({ ...s, userType: 'USER' }))
                        }
                        icon="🧍"
                    />
                </View>
            </View>

            <PrimaryButton
                title="다음"
                onPress={() => navigation.navigate('SignupName')}
                disabled={!canNext}
            />
        </View>
    );
}
