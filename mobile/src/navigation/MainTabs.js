// mobile/src/navigation/MainTabs.js (수정된 최종 코드)

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
// [수정] Vector Icons 라이브러리를 임포트합니다. (예: Ionicons 사용)
import Ionicons from 'react-native-vector-icons/Ionicons';

import HomeScreen from '../screens/HomeScreen';
import DetailsScreen from '../screens/DetailsScreen';
import MyPageScreen from '../screens/mypage/MyPageScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';

const Tab = createBottomTabNavigator();

// [수정된 부분] 탭 바 아이콘 컴포넌트 (Vector Icons 사용)
const Icon = ({ name, focused }) => {
    // 탭 이름에 따라 사용할 아이콘 이름을 매핑합니다. (플랫티콘과 유사한 디자인의 아이콘 사용)
    let iconName;
    let label;

    switch (name) {
        case 'Home':
            iconName = focused ? 'home' : 'home-outline';
            label = '홈';
            break;
        case 'Chat':
            iconName = focused ? 'chatbox' : 'chatbox-outline';
            label = '챗봇';
            break;
        case 'Calendar':
            iconName = focused ? 'calendar' : 'calendar-outline';
            label = '캘린더';
            break;
        case 'MyPage':
            iconName = focused ? 'person' : 'person-outline';
            label = '마이페이지';
            break;
        default:
            iconName = 'alert-circle-outline';
            label = '';
    }

    return (
        <View className="items-center">
            <Ionicons
                name={iconName}
                size={24}
                // NativeWind 클래스를 사용하여 색상 동적 변경
                className={`${focused ? 'text-teal-600' : 'text-gray-500'}`}
            />
            <Text className={`text-xs ${focused ? 'text-teal-600' : 'text-gray-500'}`}>
                {label}
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
                // [수정] Icon 컴포넌트로 변경
                tabBarIcon: ({ focused }) => <Icon name={route.name} focused={focused} />,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Calendar" component={CalendarScreen} />
            <Tab.Screen name="Chat" component={DetailsScreen} />
            <Tab.Screen
                name="MyPage"
                component={MyPageScreen}
            />
        </Tab.Navigator>
    );
}