// src/navigation/MainTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import MyPageScreen from '../screens/MyPageScreen';
import BottomTabBar from './_parts/BottomTabBar';
import ChatStack from './ChatStack';
const Tab = createBottomTabNavigator();

export default function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{ headerShown: false }}
            tabBar={(props) => <BottomTabBar {...props} />}
        >
            <Tab.Screen name="홈" component={HomeScreen} />
            <Tab.Screen name="챗봇" component={ChatStack} />
            <Tab.Screen name="캘린더" component={CalendarScreen} />
            <Tab.Screen name="마이페이지" component={MyPageScreen} />
        </Tab.Navigator>
    );
}
