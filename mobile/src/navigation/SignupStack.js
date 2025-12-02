// mobile/src/navigation/SignupStack.js
import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useRoute } from '@react-navigation/native';

import SignupTypeScreen from '../screens/signup/SignupTypeScreen';
import SignupNameScreen from '../screens/signup/SignupNameScreen';
import SignupVerifyScreen from '../screens/signup/SignupVerifyScreen';
import SignupPasswordScreen from '../screens/signup/SignupPasswordScreen';
import SignupRegionScreen from '../screens/signup/SignupRegionScreen';
import SignupFontScreen from '../screens/signup/SignupFontScreen';

import SignupWrapper from '../screens/signup/SignupWrapper';
import { useSignup } from '../screens/signup/SignupContext';

const Stack = createNativeStackNavigator();

// 🔹 실제 스택 (여기서 route.params로 social 모드 세팅)
function SignupStackInner() {
    const route = useRoute();
    const { params } = route || {};
    const { setData, resetSignup } = useSignup();

    useEffect(() => {
        if (params?.mode === 'social' && params?.tempToken) {
            // 카카오 신규 회원가입으로 들어온 경우
            resetSignup();
            setData(s => ({
                ...s,
                signupMode: 'social',
                socialTempToken: params.tempToken,
            }));
        }
    }, [params, resetSignup, setData]);

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="SignupType" component={SignupTypeScreen} />
            <Stack.Screen name="SignupName" component={SignupNameScreen} />
            <Stack.Screen name="SignupVerify" component={SignupVerifyScreen} />
            <Stack.Screen name="SignupPassword" component={SignupPasswordScreen} />
            <Stack.Screen name="SignupRegion" component={SignupRegionScreen} />
            <Stack.Screen name="SignupFont" component={SignupFontScreen} />
        </Stack.Navigator>
    );
}

export default function SignupStack() {
    // 🔹 여기서 한 번만 Provider/Wrapper 감싸기
    return (
        <SignupWrapper>
            <SignupStackInner />
        </SignupWrapper>
    );
}
