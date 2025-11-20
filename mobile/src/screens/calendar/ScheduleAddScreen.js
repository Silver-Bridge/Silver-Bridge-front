// mobile/src/screens/calendar/ScheduleAddScreen.js

import { createScheduleApi } from '../../shared/api/calendar';

import React, { useState, useEffect } from 'react';
import {
    View,
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Modal,
    TouchableWithoutFeedback,
} from 'react-native';

import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker';

const USER_INFO_KEY = 'USER_INFO';

// 시/분 리스트 (시: 00~23, 분: 00/30)
const HOURS = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, '0'),
);
const MINUTES = ['00', '30'];

// 24시간 → "오전/오후 HH:MM" 포맷
const formatKoreanTime = (h, m) => {
    if (!h || !m) return '';
    const hourNum = parseInt(h, 10);
    const period = hourNum < 12 ? '오전' : '오후';
    const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
    return `${period} ${String(hour12).padStart(2, '0')}:${m}`;
};

/**
 * 캘린더 일정 추가 화면
 */
export default function ScheduleAddScreen() {
    const navigation = useNavigation();
    const route = useRoute();

    // CalendarScreen에서 넘어온 날짜 (YYYY-MM-DD)
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

    // 모달 상태
    const [activeDatePicker, setActiveDatePicker] = useState(null); // 'start' | 'end' | null
    const [activeTimePicker, setActiveTimePicker] = useState(null); // 'start' | 'end' | null

    // 로그인 유저
    const [userId, setUserId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // USER_INFO에서 userId 가져오기
    useEffect(() => {
        const loadUser = async () => {
            try {
                const raw = await AsyncStorage.getItem(USER_INFO_KEY);
                if (!raw) return;
                const info = JSON.parse(raw);
                const id = info?.id ?? info?.userId;
                if (!id) {
                    console.warn('USER_INFO에 id / userId 없음:', info);
                    return;
                }
                setUserId(id);
            } catch (e) {
                console.error('USER_INFO 로딩 실패:', e);
            }
        };
        loadUser();
    }, []);

    // date + hour + minute → ISO8601
    const buildDateTime = (dateStr, h, m) => {
        if (!dateStr || !h || !m) return null;
        const timeStr = `${h}:${m}`;
        return moment(`${dateStr} ${timeStr}`, 'YYYY-MM-DD HH:mm').format();
    };

    /** 저장하기 */
    const handleAddSchedule = async () => {
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
        if (!userId) {
            Alert.alert(
                '오류',
                '사용자 정보를 불러오지 못했습니다. 다시 로그인 후 시도해주세요.',
            );
            return;
        }

        setIsSubmitting(true);

        try {
            const startAt = buildDateTime(startDate, startHour, startMinute);
            const endAt = buildDateTime(endDate, endHour, endMinute);

            if (!startAt || !endAt) {
                throw new Error('날짜/시간 형식이 잘못되었습니다.');
            }

            if (!moment(endAt).isAfter(moment(startAt))) {
                Alert.alert(
                    '입력 오류',
                    '종료 일시가 시작 일시보다 같거나 빠를 수 없습니다.',
                );
                setIsSubmitting(false);
                return;
            }

            // alarm_time은 백엔드에서 설정
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

            const res = await createScheduleApi({ userId, payload });

            console.log('일정 추가 성공:', res);
            Alert.alert('성공', '일정이 성공적으로 추가되었습니다.');
            navigation.goBack();
        } catch (error) {
            const msg =
                error?.__normalized?.message || error.message || '알 수 없는 오류 발생';
            console.error('일정 추가 실패:', msg, error);
            Alert.alert('저장 실패', msg);
            setIsSubmitting(false);
        }
    };

    const today = moment().format('YYYY-MM-DD');

    return (
        <SafeAreaView edges={[]} className="flex-1 bg-white">
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* 📌 헤더는 네이티브(Stack)에서 쓰고 있으니 여기선 제거 */}
                <ScrollView
                    className="flex-1"
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        paddingHorizontal: 24,   // px-6
                        paddingTop: 16,           // 🔻 여백 줄이기 (기존 pt-6 정도 → 8)
                        paddingBottom: 32,       // 🔻 하단 살짝만
                    }}
                >
                    <View>
                        {/* 제목 */}
                        <Text className="mb-2 text-lg text-gray-700 font-semibold">
                            일정 제목 *
                        </Text>
                        <TextInput
                            className="border border-gray-300 rounded-2xl px-4 py-4 text-lg text-gray-900"
                            placeholder="예: 병원 방문"
                            placeholderTextColor="#A0A0A0"
                            value={title}
                            onChangeText={setTitle}
                        />

                        {/* 시작 날짜 */}
                        <View className="mt-7">
                            <Text className="mb-2 text-lg text-gray-700 font-semibold">
                                시작 날짜 *
                            </Text>
                            <TouchableOpacity
                                className="border border-gray-300 rounded-2xl px-4 py-4 flex-row items-center justify-between"
                                onPress={() =>
                                    setActiveDatePicker(
                                        activeDatePicker === 'start' ? null : 'start',
                                    )
                                }
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
                                className="border border-gray-300 rounded-2xl px-4 py-4 flex-row items-center justify-between"
                                onPress={() =>
                                    setActiveDatePicker(activeDatePicker === 'end' ? null : 'end')
                                }
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
                                className="border border-gray-300 rounded-2xl px-4 py-4 flex-row items-center justify-between"
                                onPress={() =>
                                    setActiveTimePicker(
                                        activeTimePicker === 'start' ? null : 'start',
                                    )
                                }
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
                                className="border border-gray-300 rounded-2xl px-4 py-4 flex-row items-center justify-between"
                                onPress={() =>
                                    setActiveTimePicker(
                                        activeTimePicker === 'end' ? null : 'end',
                                    )
                                }
                            >
                                <Text className="text-lg text-gray-900">
                                    {formatKoreanTime(endHour, endMinute)}
                                </Text>
                                <Text className="text-sm text-gray-500">
                                    {activeTimePicker === 'end' ? '닫기 ▲' : '선택 ▼'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* 장소 */}
                        <View className="mt-8">
                            <Text className="mb-2 text-lg text-gray-700 font-semibold">
                                장소 (선택)
                            </Text>
                            <TextInput
                                className="border border-gray-300 rounded-2xl px-4 py-4 text-lg text-gray-900"
                                placeholder="예: 부경대학교 병원 물리치료실"
                                placeholderTextColor="#A0A0A0"
                                value={location}
                                onChangeText={setLocation}
                            />
                        </View>

                        {/* 메모 */}
                        <View className="mt-6 mb-6">
                            <Text className="mb-2 text-lg text-gray-700 font-semibold">
                                메모 (선택)
                            </Text>
                            <TextInput
                                className="border border-gray-300 rounded-2xl px-4 py-4 text-lg text-gray-900"
                                placeholder="필요한 내용을 메모하세요"
                                placeholderTextColor="#A0A0A0"
                                value={memo}
                                onChangeText={setMemo}
                                multiline
                                style={{ minHeight: 120, textAlignVertical: 'top' }}
                            />
                        </View>
                    </View>
                </ScrollView>

                {/* 날짜 선택 모달: 달력 */}
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
                            <View className="bg-white rounded-t-3xl p-6">
                                <Text className="text-xl font-bold mb-4 text-center">
                                    {activeDatePicker === 'start'
                                        ? '시작 날짜 선택'
                                        : '종료 날짜 선택'}
                                </Text>
                                <Calendar
                                    current={
                                        activeDatePicker === 'start' ? startDate : endDate
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

                {/* 시간 선택 모달: 네이티브 Picker 휠 */}
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
                            <View className="bg-white rounded-t-3xl p-6">
                                <Text className="text-xl font-bold mb-4 text-center">
                                    {activeTimePicker === 'start'
                                        ? '시작 시간 선택'
                                        : '종료 시간 선택'}
                                </Text>

                                <View className="flex-row bg-gray-50 rounded-2xl px-3 py-2">
                                    {/* 시 Picker */}
                                    <View className="flex-1 items-center">
                                        <Text className="text-xs text-gray-500 mb-1">시</Text>
                                        <Picker
                                            selectedValue={
                                                activeTimePicker === 'start' ? startHour : endHour
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
                                            itemStyle={{ fontSize: 22, color: '#111827' }}
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
                                        <Text className="text-xs text-gray-500 mb-1">분</Text>
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
                                            itemStyle={{ fontSize: 22, color: '#111827' }}
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
                                    <Text className="text-white font-bold text-lg">완료</Text>
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
                        onPress={handleAddSchedule}
                    >
                        <Text className="text-white text-lg font-bold">
                            {isSubmitting ? '저장 중...' : '저장하기'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
