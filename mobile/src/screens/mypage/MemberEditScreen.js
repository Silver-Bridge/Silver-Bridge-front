// mobile/src/screens/mypage/MemberEditScreen.js

import React, { useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    Alert,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSignup } from '../signup/SignupContext';
import { verifyPassword, changePassword } from '../../shared/api/user'; // ✅ 추가

// 비밀번호 유효성 검사 (예: 8~20자, 문자/숫자 하나 이상)
const isValidPassword = (pw) =>
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/.test(pw);

export default function MemberEditScreen() {
    const navigation = useNavigation();
    const { data, setData } = useSignup();

    // UI 상태 관리
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [oldPasswordError, setOldPasswordError] = useState(null);

    // 새 비밀번호 유효성
    const isValidNewPassword = isValidPassword(newPassword);

    // 최종 변경 가능 조건
    const canChange =
        isVerified && isValidNewPassword && newPassword === newPasswordConfirm;

    // --- [1. 현재 비밀번호 서버 검증] ---
    const verifyOldPassword = async () => {
        if (!oldPassword) {
            setOldPasswordError('현재 비밀번호를 입력해주세요.');
            return;
        }

        try {
            setIsSubmitting(true);
            // ✅ 백엔드에 현재 비밀번호 검증 요청
            await verifyPassword(oldPassword);

            setIsVerified(true);
            setOldPasswordError(null);
            Alert.alert('확인 완료', '새 비밀번호를 입력해 주세요.');
        } catch (e) {
            console.log('[verifyOldPassword] error:', e?.response || e);
            setIsVerified(false);
            setOldPassword('');
            setOldPasswordError(
                e?.response?.data?.message || '비밀번호가 일치하지 않습니다.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- [2. 비밀번호 변경 + DB 업데이트] ---
    const handleChangePassword = async () => {
        if (!canChange) return;

        try {
            setIsSubmitting(true);

            // ✅ 실제 서버에 비밀번호 변경 요청
            await changePassword({ oldPassword, newPassword });

            // 로컬(회원 정보 컨텍스트)에 새 비밀번호 반영 (지금 구조를 유지한다면)
            setData((s) => ({ ...s, password: newPassword }));

            Alert.alert('변경 완료', '비밀번호가 성공적으로 변경되었습니다!');
            navigation.goBack();
        } catch (e) {
            console.log('[changePassword] error:', e?.response || e);
            Alert.alert(
                '변경 실패',
                e?.response?.data?.message ||
                '비밀번호 변경 중 오류가 발생했습니다.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- UI 컴포넌트 ---

    const UserInfoText = ({ label, value }) => (
        <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-1">{label}</Text>
            <Text className="text-xl font-bold text-gray-900">{value}</Text>
        </View>
    );

    const PasswordInput = ({
                               label,
                               value,
                               onChangeText,
                               disabled = false,
                               showConfirm = false,
                           }) => (
        <View className="mt-4">
            <Text className="mb-2 text-[13px] text-gray-600">{label}</Text>
            <View className="flex-row items-center">
                <TextInput
                    className={`flex-1 border ${
                        oldPasswordError && label === '현재 비밀번호'
                            ? 'border-red-500'
                            : 'border-gray-300'
                    } rounded-xl px-4 py-4 text-[15px] ${
                        disabled ? 'bg-gray-100 text-gray-500' : 'text-gray-900'
                    }`}
                    placeholder={
                        showConfirm ? '다시 한번 입력해주세요' : '비밀번호 입력'
                    }
                    placeholderTextColor="#A0A0A0"
                    secureTextEntry
                    value={value}
                    onChangeText={(text) => {
                        onChangeText(text);
                        if (label === '현재 비밀번호') setOldPasswordError(null);
                    }}
                    editable={!disabled}
                />
                {!disabled && label === '현재 비밀번호' && (
                    <TouchableOpacity
                        className={`ml-3 px-4 py-2 rounded-lg items-center justify-center ${
                            oldPassword.length >= 4 && !isVerified && !isSubmitting
                                ? 'bg-teal-600'
                                : 'bg-gray-300'
                        }`}
                        onPress={verifyOldPassword}
                        disabled={isVerified || oldPassword.length < 4 || isSubmitting}
                    >
                        <Text className="text-white font-bold">
                            {isVerified ? '확인됨' : '확인'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {oldPasswordError && label === '현재 비밀번호' && (
                <Text className="text-xs text-red-500 mt-1">{oldPasswordError}</Text>
            )}
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView className="flex-1">
                {/* 헤더 */}
                <View className="flex-row items-center py-4 px-4 border-b border-gray-200">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text className="text-2xl">{'←'}</Text>
                    </TouchableOpacity>
                    <Text className="text-xl font-bold ml-4">내 정보</Text>
                </View>

                <View className="px-6 pt-6 pb-20">
                    {/* 사용자 기본 정보 (지금은 Context 기준) */}
                    <UserInfoText label="이름" value={data.name || '정보 없음'} />
                    <UserInfoText label="휴대폰 번호" value={data.phone || '정보 없음'} />
                    <UserInfoText label="생년월일" value="1960.01.01" />

                    {/* 현재 비밀번호 입력 */}
                    <View className="mt-8 pt-4 border-t border-gray-200">
                        <Text className="text-base font-bold mb-2">현재 비밀번호</Text>
                        <PasswordInput
                            label="현재 비밀번호"
                            value={oldPassword}
                            onChangeText={setOldPassword}
                            disabled={isVerified}
                        />
                    </View>

                    {/* 새 비밀번호 영역: isVerified 일 때 활성화 */}
                    {isVerified && (
                        <View className="mt-8 pt-4 border-t border-gray-200">
                            <Text className="text-base font-bold mb-2">새 비밀번호</Text>

                            {/* 새 비밀번호 */}
                            <PasswordInput
                                label="새 비밀번호 (8~20자, 문자/숫자 하나 이상 포함)"
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />

                            {/* 새 비밀번호 확인 */}
                            <PasswordInput
                                label="새 비밀번호 확인"
                                value={newPasswordConfirm}
                                onChangeText={setNewPasswordConfirm}
                                showConfirm
                            />

                            {/* 유효성/일치 여부 메시지 */}
                            {newPassword.length > 0 && !isValidNewPassword && (
                                <Text className="text-[12px] text-red-500 mt-2">
                                    비밀번호는 8~20자, 문자와 숫자를 모두 포함해야 합니다.
                                </Text>
                            )}
                            {newPasswordConfirm.length > 0 &&
                                newPassword !== newPasswordConfirm && (
                                    <Text className="text-[12px] text-red-500 mt-2">
                                        비밀번호가 일치하지 않습니다.
                                    </Text>
                                )}

                            {/* 변경 버튼 */}
                            <TouchableOpacity
                                className={`mt-8 rounded-xl py-4 items-center ${
                                    canChange && !isSubmitting ? 'bg-red-500' : 'bg-gray-300'
                                }`}
                                onPress={handleChangePassword}
                                disabled={!canChange || isSubmitting}
                            >
                                <Text className="text-white text-base font-bold">
                                    {isSubmitting ? '변경 중...' : '비밀번호 변경하기'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
