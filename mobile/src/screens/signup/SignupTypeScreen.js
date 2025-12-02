// mobile/src/screens/signup/SignupTypeScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import Header from './_parts/Header';
import PrimaryButton from './_parts/PrimaryButton';
import { useSignup } from './SignupContext';

// 공통 옵션 카드 컴포넌트
function Option({ label, selected, onPress, imageSource, iconSize }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            className="flex-1 items-center py-4 mx-3"
        >
            {/* 아이콘 이미지 */}
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

            {/* 라벨 */}
            <Text className="text-[17px] text-gray-800 font-semibold">
                {label}
            </Text>

            {/* 선택 표시 동그라미 */}
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

    // 아이콘 크기: 화면 너비 기준으로 살짝 조정 (최대 110)
    const iconSize = Math.min(110, width * 0.23);

    const canNext =
        data.userType === 'GUARDIAN' || data.userType === 'USER';

    return (
        <View className="flex-1 bg-white">
            <Header title="회원 유형을 선택해주세요" />

            {/* ✅ flex-1 제거해서 버튼이 바로 아래에 오도록 */}
            <View className="items-center">
                <View
                    className="mt-10 px-6"
                    style={{ width: '100%', maxWidth: 480 }}
                >
                    <View className="flex-row justify-between">
                        {/* 보호자 선택 - 여성 보호자 이미지 */}
                        <Option
                            label="보호자"
                            selected={data.userType === 'GUARDIAN'}
                            onPress={() =>
                                setData((s) => ({
                                    ...s,
                                    userType: 'GUARDIAN',
                                    role: 'ROLE_NOK', // 보호자 → ROLE_NOK
                                }))
                            }
                            imageSource={require('../../../assets/avatar_guardian_female.png')}
                            iconSize={iconSize}
                        />

                        {/* 이용자(노인) 선택 - 남성 노인 이미지 */}
                        <Option
                            label="이용자"
                            selected={data.userType === 'USER'}
                            onPress={() =>
                                setData((s) => ({
                                    ...s,
                                    userType: 'USER',
                                    role: 'ROLE_MEMBER', // 이용자(노인) → ROLE_MEMBER
                                }))
                            }
                            imageSource={require('../../../assets/avatar_elderly_male.png')}
                            iconSize={iconSize}
                        />
                    </View>
                </View>
            </View>

            {/* 버튼: 카드 바로 밑에 위치 */}
            <PrimaryButton
                title="다음"
                onPress={() => navigation.navigate('SignupName')}
                disabled={!canNext}
            />
        </View>
    );
}
