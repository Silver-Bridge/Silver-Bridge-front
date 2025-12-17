// mobile/src/navigation/RootNavigator.js (최종 수정 - 스케줄 제거)

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import LoginScreen from '../screens/LoginScreen';
import SignupStack from './SignupStack';


import RegionSettingScreen from '../screens/mypage/RegionSettingScreen';
import MemberEditScreen from '../screens/mypage/MemberEditScreen';
import FontSettingScreen from '../screens/mypage/FontSettingScreen';
import NotificationSettingScreen from '../screens/mypage/NotificationSettingScreen';
import AlarmSettingScreen from "../screens/settings/AlarmSettingScreen";


import StartScreen from '../screens/StartScreen';
import GuardianConnectScreen from "../screens/guardian/GuardianConnectScreen";
import GuardianTabs from './GuardianTabs';
const Stack = createNativeStackNavigator();

export default function RootNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName="Start"
        >
            <Stack.Screen name="Start" component={StartScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupStack}/>
            <Stack.Screen name="Main" component={MainTabs} />


            <Stack.Screen name="GuardianMain" component={GuardianTabs} />


            <Stack.Screen name="RegionSetting" component={RegionSettingScreen} />
            <Stack.Screen name="MemberEdit" component={MemberEditScreen} />
            <Stack.Screen name="FontSetting" component={FontSettingScreen} />
            <Stack.Screen name="NotificationSetting" component={NotificationSettingScreen} />
            <Stack.Screen
                name="AlarmSetting"
                component={AlarmSettingScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="GuardianConnect"
                component={GuardianConnectScreen}
            />

        </Stack.Navigator>
    );
}