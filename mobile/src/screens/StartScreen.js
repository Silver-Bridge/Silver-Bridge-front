// mobile/src/screens/StartScreen.js

import React, { useEffect } from 'react';
import { View, Text, Image, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const StartScreen = () => {
    const navigation = useNavigation();

    useEffect(() => {
        // 3초(3000ms) 후에 로그인 화면으로 이동합니다.
        const timer = setTimeout(() => {
            // 'replace'를 사용하면 뒤로 가기 버튼을 눌렀을 때 다시 이 화면으로 돌아오지 않습니다.
            navigation.replace('Login');
        }, 3000);

        // 컴포넌트가 사라질 때 타이머를 정리해줍니다 (메모리 누수 방지).
        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        // 배경색을 예시 이미지와 비슷한 크림색으로 설정합니다.
        // 만약 tailwind.config.js에 커스텀 색상을 추가하지 않았다면 bg-yellow-50 등으로 대체 가능합니다.
        <SafeAreaView className="flex-1 bg-[#FFF9E5] justify-between items-center py-10">

            {/* 상단 텍스트 영역 */}
            <View className="items-center mt-20">
                {/* 작은 로고나 아이콘이 있다면 여기에 추가 */}
                {/* <Image source={require('../../assets/images/logo.png')} className="w-10 h-10 mb-4" /> */}

                <Text className="text-2xl font-extrabold text-gray-800 mb-2">
                    실버브릿지
                </Text>
                <Text className="text-lg text-gray-600 font-medium mb-1">
                    안녕하세요, 실버브릿지입니다.
                </Text>
                <Text className="text-sm text-gray-500">
                    당신의 든든한 효도 파트너
                </Text>
            </View>

            {/* 중앙 캐릭터 이미지 영역 */}
            <View className="flex-1 justify-center items-center w-full px-10">
                {/* resizeMode="contain"으로 설정하여 이미지가 잘리지 않고 비율을 유지하게 합니다. */}
                <Image
                    source={require('../../assets/start_silbi.png')}
                    className="w-full h-full"
                    resizeMode="contain"
                />
            </View>

            {/* 하단 여백용 (필요 시 저작권 문구 등을 넣을 수 있습니다) */}
            <View className="mb-10">
                {/* <Text className="text-xs text-gray-400">© SilverBridge. All rights reserved.</Text> */}
            </View>

        </SafeAreaView>
    );
};

export default StartScreen;