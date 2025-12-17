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
            <View className="items-center mt-32">
                <Text
                    className="mb-4 text-gray-800"
                    style={{
                        fontSize: 34,
                        fontWeight: '800',
                        letterSpacing: 1.5,
                    }}
                >
                    실버브릿지
                </Text>

                <Text
                    className="text-gray-700 mb-2"
                    style={{
                        fontSize: 22,
                        fontWeight: '600',
                    }}
                >
                    안녕하세요, 실버브릿지입니다.
                </Text>

                <Text
                    className="text-gray-500"
                    style={{
                        fontSize: 18,
                        fontWeight: '500',
                    }}
                >
                    당신의 든든한 효도 파트너
                </Text>
            </View>

            <View className="flex-1 justify-center items-center w-full px-10">
                <Image
                    source={require('../../assets/start_silbi.png')}
                    className="w-full h-full"
                    resizeMode="contain"
                />
            </View>

            <View className="mb-10" />
        </SafeAreaView>
    );
};

export default StartScreen;
