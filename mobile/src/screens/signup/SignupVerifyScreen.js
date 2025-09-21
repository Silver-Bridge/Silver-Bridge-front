// src/screens/signup/SignupVerifyScreen.js
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    FlatList,
    Alert,
} from 'react-native';
import Header from './_parts/Header';
import PrimaryButton from './_parts/PrimaryButton';
import { useSignup } from './SignupContext';
import { getCarriersApi } from '../../shared/api/meta';
import { sendCodeApi, verifyCodeApi } from '../../shared/api/auth';

export default function SignupVerifyScreen({ navigation }) {
    const { data, setData } = useSignup();

    const [carrierOpen, setCarrierOpen] = useState(false);
    const [carriers, setCarriers] = useState([]);
    const [requested, setRequested] = useState(false);
    const [code, setCode] = useState('');
    const [verified, setVerified] = useState(false);

    const phoneDigits = (data.phone || '').replace(/\D/g, '');

    useEffect(() => {
        (async () => {
            try {
                const list = await getCarriersApi();
                setCarriers(list);
            } catch (e) {
                console.log('carriers load error:', e?.response?.data ?? e?.message);
            }
        })();
    }, []);

    const requestCode = async () => {
        if (!/^\d{10,11}$/.test(phoneDigits)) {
            return Alert.alert('확인', '휴대폰 번호를 정확히 입력해 주세요.');
        }
        try {
            const res = await sendCodeApi(phoneDigits);
            setRequested(true);
            // 개발 편의: 발급된 코드 표시 (릴리스에서 제거 권장)
            if (res?.devCode) Alert.alert('개발용 코드', res.devCode);
        } catch (e) {
            Alert.alert('오류', e?.response?.data?.message || e?.message);
        }
    };

    const verifyCode = async () => {
        if (!code) return;
        try {
            await verifyCodeApi({ phone: phoneDigits, code });
            setVerified(true);
            Alert.alert('인증 완료', '휴대폰 인증이 완료되었습니다.');
        } catch (e) {
            setVerified(false);
            Alert.alert('실패', e?.response?.data?.message || e?.message);
        }
    };

    const canNext =
        data.name.trim().length >= 2 &&
        /^\d{6}$/.test(data.rrnFront) &&
        /^\d{1}$/.test(data.rrnBack1) &&
        !!data.carrier &&
        phoneDigits.length >= 10 &&
        verified; // ✅ 인증 완료 시에만 다음 가능

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
                            setData((s) => ({ ...s, rrnFront: t.replace(/\D/g, '') }))
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
                            setData((s) => ({ ...s, rrnBack1: t.replace(/\D/g, '') }))
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
                            placeholder="휴대폰 번호 입력 (- 제외)"
                            placeholderTextColor="#A0A0A0"
                            keyboardType="phone-pad"
                            inputMode="tel"
                            autoComplete="tel"
                            value={data.phone}
                            onChangeText={(t) =>
                                setData((s) => ({ ...s, phone: t.replace(/\D/g, '') }))
                            }
                        />
                        <TouchableOpacity
                            className={`px-3 rounded-lg items-center justify-center ${
                                requested ? 'bg-gray-300' : 'bg-red-400'
                            }`}
                            onPress={requestCode}
                            disabled={requested}
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
                                    verified ? 'bg-green-500' : 'bg-teal-600'
                                }`}
                                onPress={verifyCode}
                            >
                                <Text className="text-white text-[12px] font-bold">
                                    {verified ? '완료' : '확인'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            {/* 다음 버튼 */}
            <PrimaryButton
                title="다음"
                onPress={() => navigation.navigate('SignupPassword')}
                disabled={!canNext}
            />

            {/* 통신사 모달(액션시트) */}
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
                    <View className="bg-white rounded-t-2xl p-4">
                        <Text className="text-base font-semibold mb-3">통신사</Text>
                        <FlatList
                            data={carriers}
                            keyExtractor={(it, idx) => `${it}-${idx}`}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className="py-3 flex-row items-center justify-between"
                                    onPress={() => {
                                        setData((s) => ({ ...s, carrier: item }));
                                        setCarrierOpen(false);
                                    }}
                                >
                                    <Text className="text-[16px] text-gray-900">{item}</Text>
                                    {data.carrier === item ? (
                                        <Text className="text-teal-600">✓</Text>
                                    ) : null}
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => (
                                <View className="h-px bg-gray-100" />
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
