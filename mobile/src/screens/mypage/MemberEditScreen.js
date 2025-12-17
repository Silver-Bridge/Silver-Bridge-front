// mobile/src/screens/mypage/MemberEditScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Alert,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
    Keyboard,
    TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSignup } from '../signup/SignupContext';
import { changePassword } from '../../shared/api/user';

const USER_INFO_KEY = 'USER_INFO';

const isValidPassword = (pw) =>
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/.test(pw);

function UserInfoRow({ label, value }) {
    return (
        <View className="mb-3">
            <Text className="text-[11px] text-gray-500 mb-1">{label}</Text>
            <Text className="text-[15px] font-semibold text-gray-900">
                {value || '정보 없음'}
            </Text>
        </View>
    );
}

function PasswordInput({
                           label,
                           value,
                           onChangeText,
                           placeholder,
                           error,
                       }) {
    return (
        <View className="mt-4 w-full">
            <Text className="mb-2 text-[13px] text-gray-700">{label}</Text>
            <TextInput
                className={`border rounded-xl px-4 py-3 text-[15px] bg-white ${
                    error ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={placeholder}
                placeholderTextColor="#A0A0A0"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={value}
                onChangeText={onChangeText}
                blurOnSubmit={false}
            />
            {!!error && (
                <Text className="text-[11px] text-red-500 mt-1">{error}</Text>
            )}
        </View>
    );
}

export default function MemberEditScreen() {
    const navigation = useNavigation();
    const { data: signupData = {}, setData } = useSignup() || {};

    const [profile, setProfile] = useState({
        name: signupData.name || '',
        phoneNumber: signupData.phone || '',
        birth: signupData.birth || '',
    });

    // 비밀번호 입력 상태
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [oldPasswordError, setOldPasswordError] = useState(null);

    const isValidNewPassword = isValidPassword(newPassword);
    const canChange =
        oldPassword.length > 0 &&
        isValidNewPassword &&
        newPassword === newPasswordConfirm &&
        !isSubmitting;

    // USER_INFO 에서 실제 정보 불러오기
    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(USER_INFO_KEY);
                if (!raw) return;

                const info = JSON.parse(raw);
                setProfile((prev) => ({
                    ...prev,
                    name: info.name || prev.name || '정보 없음',
                    phoneNumber: info.phoneNumber || prev.phoneNumber || '정보 없음',
                    birth: info.birth || prev.birth || '',
                }));
            } catch (e) {
                console.log('[MemberEdit] load USER_INFO error:', e?.message || e);
            }
        })();
    }, []);

    // 현재 비밀번호 입력 핸들러 (입력 시 에러 초기화)
    const handleOldPasswordChange = useCallback(
        (text) => {
            setOldPassword(text);
            if (oldPasswordError) {
                setOldPasswordError(null);
            }
        },
        [oldPasswordError],
    );

    // 비밀번호 변경
    const handleChangePassword = async () => {
        if (!canChange) return;

        try {
            setIsSubmitting(true);
            setOldPasswordError(null);

            await changePassword({
                currentPassword: oldPassword,
                newPassword: newPassword,
            });

            if (setData) {
                setData((s) => ({ ...s, password: newPassword }));
            }

            Alert.alert('변경 완료', '비밀번호가 성공적으로 변경되었습니다!');
            navigation.goBack();
        } catch (e) {
            console.log('[changePassword] error:', e?.response || e);
            const msg =
                e?.response?.data?.message ||
                '비밀번호 변경 중 오류가 발생했습니다.';
            setOldPasswordError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F5F5F5]">
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={{ flex: 1 }}>
                        <ScrollView
                            className="flex-1"
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="on-drag"
                            contentContainerStyle={{
                                flexGrow: 1,
                                paddingBottom: 24,
                            }}
                        >
                            <View style={{ width: '100%', alignSelf: 'center' }}>
                                <View className="w-full bg-white border-b border-gray-200">
                                    <View
                                        className="flex-row items-center py-4 px-4"
                                        style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}
                                    >
                                        <TouchableOpacity onPress={() => navigation.goBack()}>
                                            <Text className="text-2xl">{'←'}</Text>
                                        </TouchableOpacity>
                                        <Text className="text-lg font-bold ml-4">내 정보</Text>
                                    </View>
                                </View>

                                <View
                                    className="mt-4 rounded-2xl bg-white px-5 py-4 shadow-sm border border-gray-100"
                                    style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}
                                >
                                    <Text className="text-[12px] text-gray-500 mb-2">
                                        기본 정보
                                    </Text>
                                    <UserInfoRow label="이름" value={profile.name} />
                                    <UserInfoRow
                                        label="휴대폰 번호"
                                        value={profile.phoneNumber}
                                    />
                                    <UserInfoRow
                                        label="생년월일"
                                        value={profile.birth || '생년월일 정보 없음'}
                                    />
                                </View>

                                <View
                                    className="mt-5 rounded-2xl bg-white px-5 py-5 shadow-sm border border-gray-100 mb-4"
                                    style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}
                                >
                                    <Text className="text-[13px] font-bold text-gray-900 mb-1">
                                        비밀번호 변경
                                    </Text>
                                    <Text className="text-[11px] text-gray-500 mb-3">
                                        현재 비밀번호를 입력한 뒤, 새 비밀번호를 설정해 주세요.
                                    </Text>

                                    <PasswordInput
                                        label="현재 비밀번호"
                                        value={oldPassword}
                                        onChangeText={handleOldPasswordChange}
                                        placeholder="현재 사용 중인 비밀번호를 입력하세요"
                                        error={oldPasswordError}
                                    />

                                    <PasswordInput
                                        label="새 비밀번호 (8~20자, 문자/숫자 하나 이상 포함)"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        placeholder="새 비밀번호를 입력하세요"
                                        error={
                                            newPassword.length > 0 && !isValidNewPassword
                                                ? '비밀번호는 8~20자, 문자와 숫자를 모두 포함해야 합니다.'
                                                : null
                                        }
                                    />

                                    <PasswordInput
                                        label="새 비밀번호 확인"
                                        value={newPasswordConfirm}
                                        onChangeText={setNewPasswordConfirm}
                                        placeholder="새 비밀번호를 다시 입력하세요"
                                        error={
                                            newPasswordConfirm.length > 0 &&
                                            newPassword !== newPasswordConfirm
                                                ? '비밀번호가 일치하지 않습니다.'
                                                : null
                                        }
                                    />

                                    <TouchableOpacity
                                        className={`mt-6 rounded-xl py-4 items-center ${
                                            canChange ? 'bg-teal-600' : 'bg-gray-300'
                                        }`}
                                        onPress={handleChangePassword}
                                        disabled={!canChange}
                                        activeOpacity={0.85}
                                    >
                                        <Text className="text-white text-base font-bold">
                                            {isSubmitting ? '변경 중...' : '비밀번호 변경하기'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
