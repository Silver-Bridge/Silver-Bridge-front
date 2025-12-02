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
    const [submitting, setSubmitting] = useState(false); // 🔹 실제 연결 진행중 여부

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

    // [확인] 버튼 클릭 시 로직 → 형식만 체크하고 모달 열기 (API 호출 X)
    const handleCheckUser = () => {
        const rawPhone = phone.replace(/-/g, '');

        // 1. 유효성 검사 (대부분 10~11자리)
        if (rawPhone.length < 10) {
            setErrorMsg('전화번호를 올바르게 입력해주세요.');
            return;
        }

        // ✅ 여기서는 서버에 요청하지 않고, 그냥 "연결 확인 모달"만 띄움
        setModalVisible(true);
    };

    // [연결하기] 버튼 클릭 시 로직 -> 실제 연결 API 호출 + 보호자 메인으로 이동
    const handleConnect = async () => {
        const rawPhone = phone.replace(/-/g, '');

        if (rawPhone.length < 10) {
            setErrorMsg('전화번호를 올바르게 입력해주세요.');
            return;
        }

        if (submitting) return;

        try {
            setSubmitting(true);

            // 🔥 실제 API 호출: 여기서 딱 한 번만 호출
            await connectElderApi(phone); // (백엔드가 하이픈 포함을 기대한다는 전제)

            // 모달 닫기
            setModalVisible(false);

            // 안내 후 메인으로 이동
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
            console.log('[GuardianConnect] connect error (on confirm):', e);

            const msg =
                e?.response?.data?.message ||
                e?.__normalized?.message ||
                e?.message ||
                '연결 처리 중 오류가 발생했습니다.';

            Alert.alert('연결 실패', msg);
        } finally {
            setSubmitting(false);
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
                            <Text className="text-red-500 text-xs mt-2 ml-1">
                                {errorMsg}
                            </Text>
                        ) : null}

                        {/* 확인 버튼 (서버 호출 X, 모달만 오픈) */}
                        <TouchableOpacity
                            className="mt-6 rounded-xl py-4 items-center shadow-sm bg-teal-400"
                            activeOpacity={0.8}
                            onPress={handleCheckUser}
                            disabled={submitting}
                        >
                            <Text className="text-white text-[16px] font-bold">
                                확인
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
                                <Text className="text-2xl font-bold text-gray-900 text-center mb-6 leading-8">
                                    입력하신 번호({phone})의 이용자와 연결하시겠습니까?
                                </Text>

                                {/* 연결하기 버튼 */}
                                <TouchableOpacity
                                    className="bg-teal-600 rounded-xl w-32 py-3 items-center mb-3"
                                    onPress={handleConnect}
                                    disabled={submitting}
                                >
                                    <Text className="text-white font-bold text-base">
                                        {submitting ? '연결 중…' : '연결하기'}
                                    </Text>
                                </TouchableOpacity>

                                {/* 취소 버튼 */}
                                <TouchableOpacity
                                    onPress={() => setModalVisible(false)}
                                    className="p-2"
                                    disabled={submitting}
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
