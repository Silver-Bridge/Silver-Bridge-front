// mobile/src/screens/calendar/CalendarScreen.js

import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function CalendarScreen() {
    // 캘린더 페이지는 탭 네비게이터 안에 있으므로 별도의 goBack 버튼은 필요 없습니다.
    const navigation = useNavigation();

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 items-center justify-center">
                <Text className="text-3xl font-bold mb-4 text-teal-600">📅 캘린더 페이지</Text>
                <Text className="text-lg text-gray-600">여기에 일정 및 알림 기능이 구현됩니다.</Text>
            </View>
        </SafeAreaView>
    );
}