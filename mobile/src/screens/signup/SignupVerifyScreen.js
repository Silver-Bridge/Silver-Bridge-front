// src/screens/signup/SignupVerifyScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, Alert } from 'react-native';
import Header from './_parts/Header';
import PrimaryButton from './_parts/PrimaryButton';
import { useSignup } from './SignupContext';
import { sendCodeApi, verifyCodeApi } from '../../shared/api/auth';

const CARRIERS = ['SKT', 'KT', 'LG U+', '알뜰폰'];

// 010-1234-5678
function formatPhoneKR(digits) {
    const d = (digits || '').replace(/\D/g, '');
    if (d.length <= 3) return d;
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
}

export default function SignupVerifyScreen({ navigation }) {
    const { data, setData } = useSignup();
    const isSocial = data.signupMode === 'social';
    const [carrierOpen, setCarrierOpen] = useState(false);
    const [carriers, setCarriers] = useState(CARRIERS);
    const [requested, setRequested] = useState(false);
    const [code, setCode] = useState('');
    const [localVerified, setLocalVerified] = useState(false);

    // 입력은 숫자만 유지
    const phoneDigits = (data.phone || '').replace(/\D/g, '');
    // 화면 표기 + 서버 전송용 (하이푼 포함)
    const phoneHyphen = useMemo(() => formatPhoneKR(phoneDigits), [phoneDigits]);

    useEffect(() => {
        setCarriers(CARRIERS);
    }, []);

    // 번호 변경 시 상태 초기화
    useEffect(() => {
        setRequested(false);
        setLocalVerified(false);
        setData((s) => ({ ...s, verified: false }));
        setCode('');
    }, [phoneDigits, setData]);

    // 인증번호 발송
    const requestCode = async () => {
        if (!/^\d{10,11}$/.test(phoneDigits)) {
            return Alert.alert('확인', '휴대폰 번호를 정확히 입력해 주세요.');
        }
        try {
            await sendCodeApi(phoneHyphen);
            setRequested(true);
            Alert.alert('안내', `인증번호가 발송되었습니다.\n(${phoneHyphen}, 유효 5분)`);
        } catch (e) {
            const msg =
                e?.__normalized?.message ||
                e?.response?.data?.message ||
                e?.message ||
                '인증번호 발송에 실패했습니다.';
            Alert.alert('오류', msg);
        }
    };

    // 인증번호 확인
    const verifyCode = async () => {
        if (!/^\d{6}$/.test(code)) {
            return Alert.alert('확인', '인증번호 6자리를 입력해 주세요.');
        }
        try {
            await verifyCodeApi({ phoneNumber: phoneHyphen, code });
            setLocalVerified(true);
            setData((s) => ({ ...s, verified: true }));
            Alert.alert('인증 완료', '휴대폰 인증이 완료되었습니다.');
        } catch (e) {
            setLocalVerified(false);
            setData((s) => ({ ...s, verified: false }));
            const msg =
                e?.__normalized?.message ||
                e?.response?.data?.message ||
                e?.message ||
                '인증번호가 일치하지 않거나 만료되었습니다.';
            Alert.alert('실패', msg);
        }
    };

    const canNext =
        data.name.trim().length >= 2 &&
        /^\d{6}$/.test(data.rrnFront || '') &&
        /^\d{1}$/.test(data.rrnBack1 || '') &&
        phoneDigits.length >= 10 &&
        (data.verified || localVerified);

    return (
        <View className="flex-1 bg-white">
            <Header title="본인 인증을 해주세요" />

            <View className="px-6 pt-6 pb-2">
                {/* 이름 */}
                <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-4 text-[15px] text-gray-900"
                    placeholder="이름을 입력해주세요"
                    placeholderTextColor="#A0A0A0"
                    value={data.name}
                    onChangeText={(t) => setData((s) => ({ ...s, name: t }))}
                />

                {/* 주민번호 앞6 - 뒤1 */}
                <View className="mt-4 flex-row">
                    <TextInput
                        className="flex-1 border border-gray-300 rounded-xl px-4 py-4 text-[15px] text-gray-900 mr-3"
                        placeholder="주민번호앞자리"
                        placeholderTextColor="#A0A0A0"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={data.rrnFront}
                        onChangeText={(t) =>
                            setData((s) => ({
                                ...s,
                                rrnFront: t.replace(/\D/g, ''),
                            }))
                        }
                    />
                    <Text className="self-center text-xl mr-3">-</Text>
                    <TextInput
                        className="w-16 border border-gray-300 rounded-xl px-4 py-4 text-[15px] text-gray-900"
                        placeholder="0"
                        placeholderTextColor="#A0A0A0"
                        keyboardType="number-pad"
                        maxLength={1}
                        value={data.rrnBack1}
                        onChangeText={(t) =>
                            setData((s) => ({
                                ...s,
                                rrnBack1: t.replace(/\D/g, ''),
                            }))
                        }
                    />
                    <Text className="self-center ml-2 text-xl">•••••</Text>
                </View>

                {/* 통신사 선택 */}
                <TouchableOpacity
                    className="mt-4 border border-gray-300 rounded-xl px-4 py-4 flex-row justify-between"
                    onPress={() => setCarrierOpen(true)}
                    activeOpacity={0.85}
                >
                    <Text
                        className={`text-[15px] ${
                            data.carrier ? 'text-gray-900' : 'text-gray-400'
                        }`}
                    >
                        {data.carrier || '통신사'}
                    </Text>
                    <Text className="text-gray-500">▾</Text>
                </TouchableOpacity>

                {/* 휴대폰 번호 + 인증요청 */}
                <View className="mt-4">
                    <View className="flex-row">
                        <TextInput
                            className="flex-1 border border-gray-300 rounded-xl px-4 py-4 text-[15px] text-gray-900 mr-3"
                            placeholder="휴대폰 번호 입력"
                            placeholderTextColor="#A0A0A0"
                            keyboardType="phone-pad"
                            inputMode="tel"
                            autoComplete="tel"
                            value={phoneHyphen}
                            onChangeText={(t) =>
                                setData((s) => ({
                                    ...s,
                                    phone: t.replace(/\D/g, ''),
                                }))
                            }
                        />
                        <TouchableOpacity
                            className={`px-3 rounded-lg items-center justify-center ${
                                requested ? 'bg-gray-300' : 'bg-red-400'
                            }`}
                            onPress={requestCode}
                            disabled={requested}
                            activeOpacity={0.85}
                        >
                            <Text className="text-white text-[12px] font-bold">
                                {requested ? '요청됨' : '인증번호받기'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* 인증번호 입력 + 확인 */}
                    {requested && (
                        <View className="mt-3 flex-row">
                            <TextInput
                                className="flex-1 border border-gray-300 rounded-xl px-4 py-4 text-[15px] text-gray-900 mr-3"
                                placeholder="인증번호 6자리"
                                placeholderTextColor="#A0A0A0"
                                keyboardType="number-pad"
                                maxLength={6}
                                value={code}
                                onChangeText={setCode}
                            />
                            <TouchableOpacity
                                className={`px-3 rounded-lg items-center justify-center ${
                                    localVerified ? 'bg-gray-300' : 'bg-teal-600'
                                }`}
                                onPress={localVerified ? undefined : verifyCode}
                                disabled={localVerified}
                                activeOpacity={localVerified ? 1 : 0.85}
                            >
                                <Text className="text-white text-[12px] font-bold">
                                    {localVerified ? '완료' : '확인'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            {/* 다음 버튼 */}
            <PrimaryButton
                title="다음"
                onPress={() => {
                    if (isSocial) {
                        // 🔥 카카오 회원 → 비밀번호 단계 건너뛰기
                        navigation.navigate('SignupRegion');
                    } else {
                        // 기존 일반 회원가입
                        navigation.navigate('SignupPassword');
                    }
                }}
                disabled={!canNext}
            />

            {/* 통신사 모달 */}
            <Modal
                animationType="slide"
                transparent
                visible={carrierOpen}
                onRequestClose={() => setCarrierOpen(false)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/30 justify-end"
                    activeOpacity={1}
                    onPress={() => setCarrierOpen(false)}
                >
                    <View className="bg-white rounded-t-3xl pt-2 pb-6 px-5 max-h-[85%]">
                        <View className="self-center w-10 h-1.5 rounded-full bg-gray-300 mb-4" />
                        <Text className="text-[18px] font-semibold mb-4">
                            통신사 선택
                        </Text>

                        <FlatList
                            data={carriers}
                            keyExtractor={(it, idx) => `${it}-${idx}`}
                            ItemSeparatorComponent={() => (
                                <View className="h-px bg-gray-100" />
                            )}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className="py-4 flex-row items-center justify-between px-1"
                                    onPress={() => {
                                        setData((s) => ({ ...s, carrier: item }));
                                        setCarrierOpen(false);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        className={`text-[18px] ${
                                            data.carrier === item
                                                ? 'text-teal-700 font-semibold'
                                                : 'text-gray-900'
                                        }`}
                                    >
                                        {item}
                                    </Text>
                                    {data.carrier === item ? (
                                        <Text className="text-teal-600 text-[18px]">
                                            ✓
                                        </Text>
                                    ) : null}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
