import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function Header({ title }) {
    const nav = useNavigation();
    return (
        <SafeAreaView edges={['top']} className="bg-white">
            <View className="px-4 pt-4 pb-3">
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => nav.goBack()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text className="text-2xl mr-3">{'←'}</Text>
                    </TouchableOpacity>
                    <Text className="text-[18px] font-semibold text-gray-900">{title}</Text>
                </View>
            </View>
            <View className="h-px bg-gray-200" />
        </SafeAreaView>
    );
}
