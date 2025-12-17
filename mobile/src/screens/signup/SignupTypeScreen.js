// mobile/src/screens/signup/SignupTypeScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import Header from './_parts/Header';
import PrimaryButton from './_parts/PrimaryButton';
import { useSignup } from './SignupContext';

function Option({ label, selected, onPress, imageSource, iconSize }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            className="flex-1 items-center py-4 mx-3"
        >
            <View className="mb-3 items-center justify-center">
                <Image
                    source={imageSource}
                    style={{
                        width: iconSize,
                        height: iconSize,
                        borderRadius: iconSize / 2,
                    }}
                    resizeMode="cover"
                />
            </View>

            <Text className="text-[17px] text-gray-800 font-semibold">
                {label}
            </Text>
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
    const { width } = useWindowDimensions();

    const iconSize = Math.min(110, width * 0.23);

    const canNext =
        data.userType === 'GUARDIAN' || data.userType === 'USER';

    return (
        <View className="flex-1 bg-white">
            <Header title="회원 유형을 선택해주세요" />

            <View className="items-center">
                <View
                    className="mt-10 px-6"
                    style={{ width: '100%', maxWidth: 480 }}
                >
                    <View className="flex-row justify-between">
                        <Option
                            label="보호자"
                            selected={data.userType === 'GUARDIAN'}
                            onPress={() =>
                                setData((s) => ({
                                    ...s,
                                    userType: 'GUARDIAN',
                                    role: 'ROLE_NOK',
                                }))
                            }
                            imageSource={require('../../../assets/avatar_guardian_female.png')}
                            iconSize={iconSize}
                        />

                        <Option
                            label="이용자"
                            selected={data.userType === 'USER'}
                            onPress={() =>
                                setData((s) => ({
                                    ...s,
                                    userType: 'USER',
                                    role: 'ROLE_MEMBER',
                                }))
                            }
                            imageSource={require('../../../assets/avatar_elderly_male.png')}
                            iconSize={iconSize}
                        />
                    </View>
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
