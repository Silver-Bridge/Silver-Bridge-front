// mobile/src/navigation/SignupStack.js
import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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
function SignupStackInner({ route }) {
    const { params } = route || {};
    const { setData, resetSignup } = useSignup();

    useEffect(() => {
        // 스택 진입할 때마다 기본 상태 초기화
        resetSignup();

        if (params?.mode === 'social' && params?.tempToken) {
            // 🔥 카카오 신규 회원가입 플로우
            setData((s) => ({
                ...s,
                signupMode: 'social',          // ✅ 소셜 모드
                socialTempToken: params.tempToken,
            }));
        } else {
            // 🔹 일반 회원가입
            setData((s) => ({
                ...s,
                signupMode: 'normal',
                socialTempToken: null,
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

export default function SignupStack({ route }) {
    // 🔹 여기서 한 번만 Provider/Wrapper 감싸고
    //    바깥 네비게이션에서 받은 route를 그대로 안쪽으로 넘겨줌
    return (
        <SignupWrapper>
            <SignupStackInner route={route} />
        </SignupWrapper>
    );
}
