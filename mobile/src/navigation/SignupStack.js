import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import SignupTypeScreen from '../screens/signup/SignupTypeScreen';
import SignupNameScreen from '../screens/signup/SignupNameScreen';
import SignupVerifyScreen from '../screens/signup/SignupVerifyScreen';
import SignupPasswordScreen from '../screens/signup/SignupPasswordScreen';
import SignupRegionScreen from '../screens/signup/SignupRegionScreen';
import SignupFontScreen from '../screens/signup/SignupFontScreen';
import SignupWrapper from '../screens/signup/SignupWrapper';
import {SignupProvider} from '../screens/signup/SignupContext';


const Stack = createNativeStackNavigator();

export default function SignupStack() {
    return (
        <SignupProvider>

            <SignupWrapper>
                <Stack.Navigator screenOptions={{headerShown: false}}>
                    <Stack.Screen name="SignupType" component={SignupTypeScreen}/>
                    <Stack.Screen name="SignupName" component={SignupNameScreen}/>
                    <Stack.Screen name="SignupVerify" component={SignupVerifyScreen}/>
                    <Stack.Screen name="SignupPassword" component={SignupPasswordScreen}/>
                    <Stack.Screen name="SignupRegion" component={SignupRegionScreen}/>

                    <Stack.Screen name="SignupFont" component={SignupFontScreen}/>
                </Stack.Navigator>
            </SignupWrapper>
        </SignupProvider>

    );
}
