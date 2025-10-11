// mobile/src/screens/mypage/NotificationSettingScreen.js

import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
// [수정 지점] useNavigation 임포트 추가
import { useNavigation } from '@react-navigation/native';

export default function NotificationSettingScreen() {
    const navigation = useNavigation();

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView className="flex-1">
                {/* 헤더 */}
                <View className="flex-row items-center py-4 px-4 border-b border-gray-200">
                    <TouchableOpacity onPress={() => navigation.goBack()}><Text className="text-2xl">{'←'}</Text></TouchableOpacity>
                    <Text className="text-xl font-bold ml-4">알림 설정 (구현 예정)</Text>
                </View>

                <View className="p-6">
                    <Text className="text-lg text-gray-600">
                        여기에 알림 설정에 대한 기능(복약 알림, 방언 알림 등)이 추가될 예정입니다.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}