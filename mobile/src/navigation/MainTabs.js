// mobile/src/navigation/MainTabs.js (Calendar 기능 제거)

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
// import Ionicons from 'react-native-vector-icons/Ionicons'; // Vector Icons는 사용하지 않으므로 제거 가능

import HomeScreen from '../screens/HomeScreen';
import DetailsScreen from '../screens/DetailsScreen';
import MyPageScreen from '../screens/mypage/MyPageScreen';
// 🚨 CalendarScreen 임포트 제거됨

const Tab = createBottomTabNavigator();

// 탭 바 아이콘 컴포넌트
const Icon = ({ name, focused }) => {
    const iconColor = focused ? 'text-teal-600' : 'text-gray-500';

    const getIcon = () => {
        switch (name) {
            case 'Home':
                return '🏠';
            // 🚨 Calendar 아이콘 제거됨
            case 'Chat':
                return '💬';
            case 'MyPage':
                return '👤';
            default:
                return '';
        }
    };

    const getLabel = () => {
        switch (name) {
            case 'Home':
                return '홈';
            // 🚨 Calendar 라벨 제거됨
            case 'Chat':
                return '챗봇';
            case 'MyPage':
                return '마이페이지';
            default:
                return '';
        }
    };

    return (
        <View className="items-center">
            <Text className={`text-2xl ${iconColor}`}>
                {getIcon()}
            </Text>
            <Text className={`text-xs ${iconColor}`}>
                {getLabel()}
            </Text>
        </View>
    );
};


export default function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: false,
                tabBarActiveTintColor: '#0D9488',
                tabBarInactiveTintColor: '#6B7280',
                tabBarStyle: { height: 70 },
                tabBarIcon: ({ focused }) => <Icon name={route.name} focused={focused} />,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />

            {/* 🚨 Calendar 탭 제거됨 */}

            <Tab.Screen name="Chat" component={DetailsScreen} />

            <Tab.Screen
                name="MyPage"
                component={MyPageScreen}
            />
        </Tab.Navigator>
    );
}