// src/navigation/_parts/BottomTabBar.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const ICONS = {
    홈:        ({ focused }) => <Ionicons name="home" size={30} color={focused ? '#0f766e' : '#9ca3af'} />,
    챗봇:      ({ focused }) => <MaterialCommunityIcons name="robot-outline" size={30} color={focused ? '#0f766e' : '#9ca3af'} />,
    캘린더:    ({ focused }) => <Ionicons name="calendar" size={30} color={focused ? '#0f766e' : '#9ca3af'} />,
    마이페이지: ({ focused }) => <Ionicons name="person" size={30} color={focused ? '#0f766e' : '#9ca3af'} />,
};

export default function BottomTabBar({ state, descriptors, navigation }) {
    return (
        <SafeAreaView edges={['bottom']} className="bg-white">

            <View className="mx-3 mb-2 rounded-2xl bg-white shadow-md shadow-black/10 border border-gray-100">
                <View className="flex-row items-stretch justify-between px-2 py-1">
                    {state.routes.map((route, index) => {
                        const focused = state.index === index;
                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });
                            if (!focused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };
                        const onLongPress = () => {
                            navigation.emit({ type: 'tabLongPress', target: route.key });
                        };

                        const Icon = ICONS[route.name] || (() => null);

                        return (
                            <TouchableOpacity
                                key={route.key}
                                accessibilityRole="button"
                                accessibilityState={focused ? { selected: true } : {}}
                                onPress={onPress}
                                onLongPress={onLongPress}
                                className="flex-1 items-center py-2"
                                activeOpacity={0.85}
                            >
                                <View className={`w-10 h-10 rounded-full items-center justify-center ${focused ? 'bg-teal-50' : ''}`}>
                                    <Icon focused={focused} />
                                </View>
                                <Text className={`mt-1 text-[11px] ${focused ? 'text-teal-700 font-semibold' : 'text-gray-400'}`}>
                                    {route.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </SafeAreaView>
    );
}
