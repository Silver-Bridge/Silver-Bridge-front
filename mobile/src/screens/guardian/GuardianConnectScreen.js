import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
// 🔹 실제 백엔드 API
import { connectElderApi } from '../../shared/api/guardian';

export default function GuardianConnectScreen() {
    const navigation = useNavigation();

    // 입력 상태
    const [phone, setPhone] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // 모달 상태
    const [modalVisible, setModalVisible] = useState(false);

    // 전화번호 입력 포맷팅 (010-xxxx-xxxx)
    const handlePhoneChange = (text) => {
        if (errorMsg) setErrorMsg('');

        const digits = text.replace(/\D/g, '');
        let formatted = digits;

        if (digits.length > 3 && digits.length <= 7) {
            formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
        } else if (digits.length > 7) {
            formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(
                7,
                11,
            )}`;
        }

        setPhone(formatted);
    };

    // [확인] 버튼 클릭 시 로직 → 서버에 연결 요청
    const handleCheckUser = async () => {
        const rawPhone = phone.replace(/-/g, '');

        // 1. 유효성 검사 (대부분 10~11자리)
        if (rawPhone.length < 10) {
            setErrorMsg('전화번호를 올바르게 입력해주세요.');
            return;
        }

        if (submitting) return;

        try {
            setSubmitting(true);
            setErrorMsg('');

            // 🔥 백엔드에 elderPhone 그대로 전달 (하이픈 포함)
            const res = await connectElderApi(phone);

            // 성공: 서버에서 예외 안 던지면 연결 성공
            console.log('[GuardianConnect] connect success:', res);
            setModalVisible(true);
        } catch (e) {
            console.log('[GuardianConnect] connect error:', e);

            const msg =
                e?.response?.data?.message ||
                e?.__normalized?.message ||
                e?.message ||
                '연결 과정에서 오류가 발생했습니다.';

            setErrorMsg(msg);
            Alert.alert('연결 실패', msg);
        } finally {
            setSubmitting(false);
        }
    };

    // [연결하기] 버튼 클릭 시 로직 -> 보호자 메인으로 이동
    const handleConnect = async () => {
        try {
            const rawPhone = phone.replace(/-/g, '');

            if (rawPhone.length < 10) {
                setErrorMsg('전화번호를 올바르게 입력해주세요.');
                return;
            }

            // 🔥 실제 API 호출
            await connectElderApi(phone); // or rawPhone, 백엔드에서 기대하는 포맷에 맞게

            // 안내
            Alert.alert('안내', '이용자와 성공적으로 연결되었습니다.', [
                {
                    text: '확인',
                    onPress: () => {
                        // ✅ 보호자 메인 스택으로 리셋
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'GuardianMain' }],
                            }),
                        );
                    },
                },
            ]);
        } catch (e) {
            const msg =
                e?.response?.data?.message ||
                e?.message ||
                '연결 처리 중 오류가 발생했습니다.';
            Alert.alert('연결 실패', msg);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    className="flex-1"
                >
                    {/* 헤더 */}
                    <View className="px-5 pt-6 pb-4 border-b border-gray-100">
                        <Text className="text-xl font-bold text-gray-900">
                            이용자의 연락처를 입력해주세요
                        </Text>
                    </View>

                    {/* 본문 */}
                    <View className="px-5 pt-8">
                        {/* 입력창 */}
                        <TextInput
                            className={`border rounded-xl px-4 py-4 text-[16px] text-gray-900 ${
                                errorMsg
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-300 bg-white'
                            }`}
                            placeholder="전화번호를 입력해주세요"
                            placeholderTextColor="#A0A0A0"
                            keyboardType="number-pad"
                            value={phone}
                            onChangeText={handlePhoneChange}
                        />

                        {/* 에러 메시지 */}
                        {errorMsg ? (
                            <Text className="text-red-500 text-xs mt-2 ml-1">{errorMsg}</Text>
                        ) : null}

                        {/* 확인 버튼 */}
                        <TouchableOpacity
                            className={`mt-6 rounded-xl py-4 items-center shadow-sm ${
                                submitting ? 'bg-teal-300' : 'bg-teal-400'
                            }`}
                            activeOpacity={0.8}
                            onPress={handleCheckUser}
                            disabled={submitting}
                        >
                            <Text className="text-white text-[16px] font-bold">
                                {submitting ? '확인 중…' : '확인'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* 성공 팝업 모달 */}
                    <Modal
                        animationType="fade"
                        transparent={true}
                        visible={modalVisible}
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <View className="flex-1 bg-black/40 justify-center items-center px-8">
                            <View className="bg-white w-full rounded-2xl p-8 items-center shadow-lg">
                                <Text className="text-xl font-bold text-gray-900 text-center mb-6 leading-8">
                                    입력하신 번호({phone})의 이용자와{'\n'}
                                    연결하시겠습니까?
                                </Text>

                                {/* 연결하기 버튼 */}
                                <TouchableOpacity
                                    className="bg-teal-600 rounded-xl w-32 py-3 items-center mb-3"
                                    onPress={handleConnect}
                                >
                                    <Text className="text-white font-bold text-base">
                                        연결하기
                                    </Text>
                                </TouchableOpacity>

                                {/* 취소 버튼 */}
                                <TouchableOpacity
                                    onPress={() => setModalVisible(false)}
                                    className="p-2"
                                >
                                    <Text className="text-gray-400 text-sm underline decoration-gray-400">
                                        취소
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}
