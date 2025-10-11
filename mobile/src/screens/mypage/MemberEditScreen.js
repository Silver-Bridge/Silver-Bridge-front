// mobile/src/screens/mypage/MemberEditScreen.js

import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
// [오류 해결] useNavigation은 여기서 임포트됩니다.
import { useNavigation } from '@react-navigation/native';
import { useSignup } from '../signup/SignupContext';
import client from '../../shared/api/client';

// 임시 API 함수: Mock 서버에서 비밀번호 변경 API를 호출한다고 가정
const updateUserInfoApi = async (payload) => {
    // [서버 연결 필요 지점] 실제로는 이 코드를 서버 인증 API 호출로 대체해야 합니다.
    // client.patch('/user/me', payload);
    return new Promise(resolve => setTimeout(resolve, 500));
};

export default function MemberEditScreen() {
    const navigation = useNavigation(); // [useNavigation 사용]
    const { data, setData } = useSignup();

    // UI 상태 관리
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [oldPasswordError, setOldPasswordError] = useState(null); // 인라인 오류 메시지 상태

    // 비밀번호 유효성 검사 (예: 8~20자, 문자/숫자 하나 이상)
    const isValidNewPassword = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/.test(newPassword);

    // 최종 변경 가능 조건
    const canChange = isVerified && isValidNewPassword && newPassword === newPasswordConfirm;

    // --- [1. 기존 비밀번호 확인 로직] ---
    const verifyOldPassword = async () => {
        if (!oldPassword) {
            setOldPasswordError('현재 비밀번호를 입력해주세요.');
            return;
        }

        // Mocking: Context의 목 비밀번호와 일치하는지 확인
        const actualPassword = data.password;

        if (oldPassword === actualPassword) {
            setIsVerified(true);
            setOldPasswordError(null);
            Alert.alert('확인 완료', '새 비밀번호를 입력해 주세요.');
        } else {
            setIsVerified(false);
            setOldPassword('');
            setOldPasswordError('비밀번호가 일치하지 않습니다.');
        }
    };

    // --- [2. 비밀번호 변경 및 서버 업데이트 로직] ---
    const handleChangePassword = async () => {
        if (!canChange) return;

        try {
            setIsSubmitting(true);

            // [서버 연결 필요 지점] 실제 API 호출로 대체해야 합니다.
            await updateUserInfoApi({ password: newPassword });

            // Zustand 상태 업데이트
            setData(s => ({ ...s, password: newPassword }));

            Alert.alert('변경 완료', '비밀번호가 성공적으로 변경되었습니다!');
            navigation.goBack();

        } catch (e) {
            Alert.alert('변경 실패', '비밀번호 변경 중 오류가 발생했습니다.');
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

    const PasswordInput = ({ label, value, onChangeText, disabled = false, showConfirm = false }) => (
        <View className="mt-4">
            <Text className="mb-2 text-[13px] text-gray-600">{label}</Text>
            <View className="flex-row items-center">
                <TextInput
                    className={`flex-1 border ${oldPasswordError && label === '현재 비밀번호' ? 'border-red-500' : 'border-gray-300'} rounded-xl px-4 py-4 text-[15px] ${disabled ? 'bg-gray-100 text-gray-500' : 'text-gray-900'}`}
                    placeholder={showConfirm ? "다시 한번 입력해주세요" : "비밀번호 입력"}
                    placeholderTextColor="#A0A0A0"
                    secureTextEntry
                    value={value}
                    // 입력 시 오류 메시지 초기화
                    onChangeText={(text) => {
                        onChangeText(text);
                        if (label === '현재 비밀번호') setOldPasswordError(null);
                    }}
                    editable={!disabled}
                />
                {!disabled && label === '현재 비밀번호' && (
                    <TouchableOpacity
                        className={`ml-3 px-4 py-2 rounded-lg items-center justify-center ${oldPassword.length > 3 && !isVerified ? 'bg-teal-600' : 'bg-gray-300'}`}
                        onPress={verifyOldPassword}
                        disabled={isVerified || oldPassword.length < 4}
                    >
                        <Text className="text-white font-bold">{isVerified ? '확인됨' : '확인'}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* 현재 비밀번호 오류 인라인 표시 */}
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
                    <TouchableOpacity onPress={() => navigation.goBack()}><Text className="text-2xl">{'←'}</Text></TouchableOpacity>
                    <Text className="text-xl font-bold ml-4">내 정보</Text>
                </View>

                <View className="px-6 pt-6 pb-20">
                    {/* 사용자 기본 정보 (수정 불가능한 영역) */}
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

                    {/* 새 비밀번호 입력 영역: isVerified일 때만 활성화 */}
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
                                showConfirm={true}
                            />

                            {/* 유효성/일치 여부 메시지 */}
                            {newPasswordConfirm.length > 0 && newPassword !== newPasswordConfirm && (
                                <Text className="text-[12px] text-red-500 mt-2">비밀번호가 일치하지 않습니다.</Text>
                            )}

                            {/* 변경 버튼 */}
                            <TouchableOpacity
                                className={`mt-8 rounded-xl py-4 items-center ${canChange ? 'bg-red-500' : 'bg-gray-300'}`}
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