// mobile/src/screens/guardian/GuardianScheduleAddScreen.js

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Modal,
    TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';

import { createScheduleApi } from '../../shared/api/calendar';

// 시/분 리스트
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '30'];

// 알림 옵션
const ALARM_OPTIONS = [
    { label: '알림 없음', value: null },
    { label: '정시 알림 (시작 시간)', value: 0 },
    { label: '5분 전', value: 5 },
    { label: '10분 전', value: 10 },
    { label: '30분 전', value: 30 },
    { label: '1시간 전', value: 60 },
    { label: '하루 전', value: 60 * 24 },
];

// 24h → 오전/오후 HH:MM
const formatKoreanTime = (h, m) => {
    if (!h || !m) return '';
    const hourNum = parseInt(h, 10);
    const period = hourNum < 12 ? '오전' : '오후';
    const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
    return `${period} ${String(hour12).padStart(2, '0')}:${m}`;
};

// date + hour + minute → ISO8601 (+09:00 포함)
const buildDateTime = (dateStr, h, m) => {
    if (!dateStr || !h || !m) return null;
    const timeStr = `${h}:${m}`;
    return moment(`${dateStr} ${timeStr}`, 'YYYY-MM-DD HH:mm').format();
};

const GuardianScheduleAddScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();

    // 캘린더에서 넘어온 날짜 (없으면 오늘)
    const initialDate = route.params?.date ?? moment().format('YYYY-MM-DD');

    // 입력 state
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState(initialDate);
    const [endDate, setEndDate] = useState(initialDate);

    // 기본 시간: 16:30 ~ 17:30
    const [startHour, setStartHour] = useState('16');
    const [startMinute, setStartMinute] = useState('30');
    const [endHour, setEndHour] = useState('17');
    const [endMinute, setEndMinute] = useState('30');

    const [memo, setMemo] = useState('');
    const [location, setLocation] = useState('');

    const [alarmMinutes, setAlarmMinutes] = useState(10);
    const [alarmModalVisible, setAlarmModalVisible] = useState(false);

    const [activeDatePicker, setActiveDatePicker] = useState(null); // 'start' | 'end'
    const [activeTimePicker, setActiveTimePicker] = useState(null); // 'start' | 'end'

    const [isSubmitting, setIsSubmitting] = useState(false);

    const today = moment().format('YYYY-MM-DD');

    const currentAlarmLabel = (() => {
        const found = ALARM_OPTIONS.find((opt) => opt.value === alarmMinutes);
        return found ? found.label : '알림 없음';
    })();

    const handleSave = async () => {
        if (isSubmitting) return;

        if (!title.trim()) {
            Alert.alert('입력 오류', '일정 제목을 입력해 주세요.');
            return;
        }
        if (!startDate || !endDate) {
            Alert.alert('입력 오류', '시작 날짜와 종료 날짜를 모두 선택해 주세요.');
            return;
        }
        if (!startHour || !startMinute || !endHour || !endMinute) {
            Alert.alert('입력 오류', '시작 시간과 종료 시간을 모두 선택해 주세요.');
            return;
        }

        const startAt = buildDateTime(startDate, startHour, startMinute);
        const endAt = buildDateTime(endDate, endHour, endMinute);

        if (!startAt || !endAt) {
            Alert.alert('입력 오류', '날짜/시간 형식이 잘못되었습니다.');
            return;
        }
        if (!moment(endAt).isAfter(moment(startAt))) {
            Alert.alert('입력 오류', '종료 일시가 시작 일시보다 같거나 빠를 수 없습니다.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                title: title.trim(),
                description: memo.trim(),
                start_at: startAt,
                end_at: endAt,
                all_day: false,
                location: location.trim(),
                repeat_type: 'NONE',
                priority: 'MEDIUM',
            };

            if (alarmMinutes !== null && alarmMinutes !== undefined) {
                payload.alarm_minutes = alarmMinutes;
            }

            const res = await createScheduleApi({ payload });
            console.log('[GuardianScheduleAdd] 일정 추가 성공', res);

            Alert.alert('완료', '일정을 성공적으로 등록했습니다.', [
                {
                    text: '확인',
                    onPress: () => navigation.goBack(),
                },
            ]);
        } catch (e) {
            const msg =
                e?.response?.data?.message ||
                e?.__normalized?.message ||
                e?.message ||
                '알 수 없는 오류가 발생했습니다.';
            console.log('[GuardianScheduleAdd] 일정 추가 실패', msg, e);
            Alert.alert('저장 실패', msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-white">
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* 상단 헤더 (커스텀) */}
                <View className="flex-row items-center py-4 px-4 border-b border-gray-100">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold ml-3 text-gray-900">
                        대신 일정 등록하기
                    </Text>
                </View>

                <ScrollView
                    className="flex-1"
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        paddingHorizontal: 24,
                        paddingTop: 16,
                        paddingBottom: 32,
                        alignItems: 'center',
                    }}
                >
                    {/* 가운데 정렬 + 최대 폭 480 */}
                    <View style={{ width: '100%', maxWidth: 480 }}>
                        {/* 제목 */}
                        <Text className="mb-2 text-lg text-gray-700 font-semibold">
                            일정 제목 *
                        </Text>
                        <TextInput
                            className="border border-gray-300 rounded-2xl text-gray-900"
                            placeholder="예: 병원 방문"
                            placeholderTextColor="#A0A0A0"
                            value={title}
                            onChangeText={setTitle}
                            style={{
                                paddingHorizontal: 16,
                                paddingVertical: Platform.OS === 'ios' ? 14 : 10,
                                fontSize: 18,
                                textAlignVertical:
                                    Platform.OS === 'android' ? 'center' : 'auto',
                            }}
                        />

                        {/* 시작 날짜 */}
                        <View className="mt-7">
                            <Text className="mb-2 text-lg text-gray-700 font-semibold">
                                시작 날짜 *
                            </Text>
                            <TouchableOpacity
                                className="border border-gray-300 rounded-2xl flex-row items-center justify-between"
                                onPress={() =>
                                    setActiveDatePicker(
                                        activeDatePicker === 'start' ? null : 'start',
                                    )
                                }
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical:
                                        Platform.OS === 'ios' ? 14 : 10,
                                }}
                            >
                                <Text className="text-lg text-gray-900">
                                    {moment(startDate).format('YYYY.MM.DD (ddd)')}
                                </Text>
                                <Text className="text-sm text-gray-500">
                                    {activeDatePicker === 'start' ? '닫기 ▲' : '달력 ▼'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* 종료 날짜 */}
                        <View className="mt-6">
                            <Text className="mb-2 text-lg text-gray-700 font-semibold">
                                종료 날짜 *
                            </Text>
                            <TouchableOpacity
                                className="border border-gray-300 rounded-2xl flex-row items-center justify-between"
                                onPress={() =>
                                    setActiveDatePicker(
                                        activeDatePicker === 'end' ? null : 'end',
                                    )
                                }
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical:
                                        Platform.OS === 'ios' ? 14 : 10,
                                }}
                            >
                                <Text className="text-lg text-gray-900">
                                    {moment(endDate).format('YYYY.MM.DD (ddd)')}
                                </Text>
                                <Text className="text-sm text-gray-500">
                                    {activeDatePicker === 'end' ? '닫기 ▲' : '달력 ▼'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* 시작 시간 */}
                        <View className="mt-8">
                            <Text className="mb-2 text-lg text-gray-700 font-semibold">
                                시작 시간 *
                            </Text>
                            <TouchableOpacity
                                className="border border-gray-300 rounded-2xl flex-row items-center justify-between"
                                onPress={() =>
                                    setActiveTimePicker(
                                        activeTimePicker === 'start' ? null : 'start',
                                    )
                                }
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical:
                                        Platform.OS === 'ios' ? 14 : 10,
                                }}
                            >
                                <Text className="text-lg text-gray-900">
                                    {formatKoreanTime(startHour, startMinute)}
                                </Text>
                                <Text className="text-sm text-gray-500">
                                    {activeTimePicker === 'start' ? '닫기 ▲' : '선택 ▼'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* 종료 시간 */}
                        <View className="mt-6">
                            <Text className="mb-2 text-lg text-gray-700 font-semibold">
                                종료 시간 *
                            </Text>
                            <TouchableOpacity
                                className="border border-gray-300 rounded-2xl flex-row items-center justify-between"
                                onPress={() =>
                                    setActiveTimePicker(
                                        activeTimePicker === 'end' ? null : 'end',
                                    )
                                }
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical:
                                        Platform.OS === 'ios' ? 14 : 10,
                                }}
                            >
                                <Text className="text-lg text-gray-900">
                                    {formatKoreanTime(endHour, endMinute)}
                                </Text>
                                <Text className="text-sm text-gray-500">
                                    {activeTimePicker === 'end' ? '닫기 ▲' : '선택 ▼'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* 알림 시간 */}
                        <View className="mt-8">
                            <Text className="mb-2 text-lg text-gray-700 font-semibold">
                                알림 시간 (선택)
                            </Text>
                            <TouchableOpacity
                                className="border border-gray-300 rounded-2xl flex-row items-center justify-between"
                                onPress={() => setAlarmModalVisible(true)}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical:
                                        Platform.OS === 'ios' ? 14 : 10,
                                }}
                            >
                                <Text className="text-lg text-gray-900">
                                    {currentAlarmLabel}
                                </Text>
                                <Text className="text-sm text-gray-500">선택 ▼</Text>
                            </TouchableOpacity>
                        </View>

                        {/* 장소 */}
                        <View className="mt-8">
                            <Text className="mb-2 text-lg text-gray-700 font-semibold">
                                장소 (선택)
                            </Text>
                            <TextInput
                                className="border border-gray-300 rounded-2xl text-gray-900"
                                placeholder="예: 부경대학교 병원 물리치료실"
                                placeholderTextColor="#A0A0A0"
                                value={location}
                                onChangeText={setLocation}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical:
                                        Platform.OS === 'ios' ? 14 : 10,
                                    fontSize: 18,
                                    textAlignVertical:
                                        Platform.OS === 'android' ? 'center' : 'auto',
                                }}
                            />
                        </View>

                        {/* 메모 */}
                        <View className="mt-6 mb-6">
                            <Text className="mb-2 text-lg text-gray-700 font-semibold">
                                메모 (선택)
                            </Text>
                            <TextInput
                                className="border border-gray-300 rounded-2xl text-gray-900"
                                placeholder="필요한 내용을 메모하세요"
                                placeholderTextColor="#A0A0A0"
                                value={memo}
                                onChangeText={setMemo}
                                multiline
                                style={{
                                    minHeight: 120,
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    fontSize: 18,
                                    textAlignVertical: 'top',
                                }}
                            />
                        </View>
                    </View>
                </ScrollView>

                {/* 날짜 선택 모달 */}
                <Modal
                    visible={!!activeDatePicker}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setActiveDatePicker(null)}
                >
                    <TouchableOpacity
                        className="flex-1 bg-black/30 justify-end"
                        activeOpacity={1}
                        onPressOut={() => setActiveDatePicker(null)}
                    >
                        <TouchableWithoutFeedback>
                            <View
                                className="bg-white rounded-t-3xl p-6"
                                style={{
                                    width: '100%',
                                    maxWidth: 480,
                                    alignSelf: 'center',
                                }}
                            >
                                <Text className="text-xl font-bold mb-4 text-center">
                                    {activeDatePicker === 'start'
                                        ? '시작 날짜 선택'
                                        : '종료 날짜 선택'}
                                </Text>
                                <Calendar
                                    current={
                                        activeDatePicker === 'start'
                                            ? startDate
                                            : endDate
                                    }
                                    minDate={today}
                                    onDayPress={(day) => {
                                        if (activeDatePicker === 'start') {
                                            setStartDate(day.dateString);
                                        } else {
                                            setEndDate(day.dateString);
                                        }
                                        setActiveDatePicker(null);
                                    }}
                                    theme={{
                                        todayTextColor: '#0D9488',
                                        selectedDayBackgroundColor: '#0D9488',
                                        selectedDayTextColor: '#ffffff',
                                        arrowColor: '#0D9488',
                                        monthTextColor: '#111827',
                                    }}
                                />
                            </View>
                        </TouchableWithoutFeedback>
                    </TouchableOpacity>
                </Modal>

                {/* 시간 선택 모달 */}
                <Modal
                    visible={!!activeTimePicker}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setActiveTimePicker(null)}
                >
                    <TouchableOpacity
                        className="flex-1 bg-black/30 justify-end"
                        activeOpacity={1}
                        onPressOut={() => setActiveTimePicker(null)}
                    >
                        <TouchableWithoutFeedback>
                            <View
                                className="bg-white rounded-t-3xl p-6"
                                style={{
                                    width: '100%',
                                    maxWidth: 480,
                                    alignSelf: 'center',
                                }}
                            >
                                <Text className="text-xl font-bold mb-4 text-center">
                                    {activeTimePicker === 'start'
                                        ? '시작 시간 선택'
                                        : '종료 시간 선택'}
                                </Text>

                                <View className="flex-row bg-gray-50 rounded-2xl px-3 py-2">
                                    {/* 시 Picker */}
                                    <View className="flex-1 items-center">
                                        <Text className="text-xs text-gray-500 mb-1">
                                            시
                                        </Text>
                                        <Picker
                                            selectedValue={
                                                activeTimePicker === 'start'
                                                    ? startHour
                                                    : endHour
                                            }
                                            onValueChange={(value) => {
                                                if (activeTimePicker === 'start') {
                                                    setStartHour(value);
                                                } else {
                                                    setEndHour(value);
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                height: 180,
                                                color: '#111827',
                                            }}
                                            itemStyle={{
                                                fontSize: 22,
                                                color: '#111827',
                                            }}
                                        >
                                            {HOURS.map((h) => (
                                                <Picker.Item
                                                    label={h}
                                                    value={h}
                                                    key={h}
                                                    color="#111827"
                                                />
                                            ))}
                                        </Picker>
                                    </View>

                                    {/* 분 Picker */}
                                    <View className="flex-1 items-center">
                                        <Text className="text-xs text-gray-500 mb-1">
                                            분
                                        </Text>
                                        <Picker
                                            selectedValue={
                                                activeTimePicker === 'start'
                                                    ? startMinute
                                                    : endMinute
                                            }
                                            onValueChange={(value) => {
                                                if (activeTimePicker === 'start') {
                                                    setStartMinute(value);
                                                } else {
                                                    setEndMinute(value);
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                height: 180,
                                                color: '#111827',
                                            }}
                                            itemStyle={{
                                                fontSize: 22,
                                                color: '#111827',
                                            }}
                                        >
                                            {MINUTES.map((m) => (
                                                <Picker.Item
                                                    label={m}
                                                    value={m}
                                                    key={m}
                                                    color="#111827"
                                                />
                                            ))}
                                        </Picker>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    className="mt-6 bg-teal-600 py-3.5 rounded-2xl items-center"
                                    onPress={() => setActiveTimePicker(null)}
                                >
                                    <Text className="text-white font-bold text-lg">
                                        완료
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </TouchableOpacity>
                </Modal>

                {/* 알림 선택 모달 */}
                <Modal
                    visible={alarmModalVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setAlarmModalVisible(false)}
                >
                    <TouchableOpacity
                        className="flex-1 bg-black/30 justify-end"
                        activeOpacity={1}
                        onPressOut={() => setAlarmModalVisible(false)}
                    >
                        <TouchableWithoutFeedback>
                            <View
                                className="bg-white rounded-t-3xl p-6"
                                style={{
                                    width: '100%',
                                    maxWidth: 480,
                                    alignSelf: 'center',
                                }}
                            >
                                <Text className="text-xl font-bold mb-4 text-center">
                                    알림 시간 선택
                                </Text>

                                {ALARM_OPTIONS.map((opt) => (
                                    <TouchableOpacity
                                        key={opt.label}
                                        className="py-3 px-2 flex-row items-center justify-between"
                                        onPress={() => {
                                            setAlarmMinutes(opt.value);
                                            setAlarmModalVisible(false);
                                        }}
                                    >
                                        <Text className="text-lg text-gray-800">
                                            {opt.label}
                                        </Text>
                                        {opt.value === alarmMinutes && (
                                            <Text className="text-teal-600 text-base">
                                                ●
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                ))}

                                <TouchableOpacity
                                    className="mt-4 bg-gray-100 py-3.5 rounded-2xl items-center"
                                    onPress={() => setAlarmModalVisible(false)}
                                >
                                    <Text className="text-gray-700 font-semibold text-lg">
                                        닫기
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </TouchableOpacity>
                </Modal>

                {/* 하단 저장 버튼 */}
                <View className="p-4 border-t border-gray-200">
                    <TouchableOpacity
                        className={`rounded-2xl py-4 items-center ${
                            isSubmitting ? 'bg-gray-300' : 'bg-teal-600'
                        }`}
                        activeOpacity={0.8}
                        disabled={isSubmitting}
                        onPress={handleSave}
                    >
                        <Text className="text-white text-lg font-bold">
                            {isSubmitting ? '저장 중...' : '저장하기'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default GuardianScheduleAddScreen;
