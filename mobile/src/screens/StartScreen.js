// mobile/src/screens/StartScreen.js

import React, { useEffect } from 'react';
import { View, Text, Image, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const StartScreen = () => {
    const navigation = useNavigation();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.replace('Login');
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <SafeAreaView className="flex-1 bg-[#FFF9E5] items-center py-10">
            {/* 상단 텍스트 영역 - 더 아래로 & 글자 크게 */}
            <View className="items-center mt-32">
                {/* 앱 이름 - 가장 크고 두껍게 */}
                <Text
                    className="mb-4 text-gray-800"
                    style={{
                        fontSize: 34, // text-4xl보다 조금 더 키운 느낌
                        fontWeight: '800',
                        letterSpacing: 1.5,
                        // 커스텀 폰트 쓰고 싶으면 아래처럼:
                        // fontFamily: 'Pretendard-Bold',
                    }}
                >
                    실버브릿지
                </Text>

                {/* 인사 문구 - 살짝 작게, 하지만 여전히 큼 */}
                <Text
                    className="text-gray-700 mb-2"
                    style={{
                        fontSize: 22, // text-2xl 급
                        fontWeight: '600',
                        // fontFamily: 'Pretendard-SemiBold',
                    }}
                >
                    안녕하세요, 실버브릿지입니다.
                </Text>

                {/* 슬로건 - 중간 정도 크기 + 부드러운 느낌 */}
                <Text
                    className="text-gray-500"
                    style={{
                        fontSize: 18,
                        fontWeight: '500',
                        // fontFamily: 'Pretendard-Medium',
                    }}
                >
                    당신의 든든한 효도 파트너
                </Text>
            </View>

            {/* 중앙 캐릭터 이미지 영역 */}
            <View className="flex-1 justify-center items-center w-full px-10">
                <Image
                    source={require('../../assets/start_silbi.png')}
                    className="w-full h-full"
                    resizeMode="contain"
                />
            </View>

            {/* 하단 여백용 */}
            <View className="mb-10" />
        </SafeAreaView>
    );
};

export default StartScreen;
