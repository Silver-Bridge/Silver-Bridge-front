
// src/navigation/MainTabs.js

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
// import Ionicons from 'react-native-vector-icons/Ionicons'; // Vector Icons는 사용하지 않으므로 제거 가능

import HomeScreen from '../screens/HomeScreen';
import MyPageScreen from '../screens/mypage/MyPageScreen';
import BottomTabBar from './_parts/BottomTabBar';
import ChatStack from './ChatStack';
import CalendarStack from './CalendarStack';

const Tab = createBottomTabNavigator();

// 탭 바 아이콘 컴포넌트
const Icon = ({ name, focused }) => {
    const iconColor = focused ? 'text-teal-600' : 'text-gray-500';

    const getIcon = () => {
        switch (name) {
            case 'Home':
                return '🏠';
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

            screenOptions={{ headerShown: false }}
            tabBar={(props) => <BottomTabBar {...props} />}
        >
            <Tab.Screen name="홈" component={HomeScreen} />
            <Tab.Screen name="챗봇" component={ChatStack} />
            <Tab.Screen name="캘린더" component={CalendarStack} />
            <Tab.Screen name="마이페이지" component={MyPageScreen} />

        </Tab.Navigator>
    );
}