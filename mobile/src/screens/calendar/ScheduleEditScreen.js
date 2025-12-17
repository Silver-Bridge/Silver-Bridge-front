// mobile/src/screens/calendar/ScheduleEditScreen.js

import React, { useState, useEffect, useLayoutEffect  } from 'react';
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
import moment from 'moment';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker';

import { updateScheduleApi } from '../../shared/api/calendar';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '30'];

const formatKoreanTime = (h, m) => {
    if (!h || !m) return '';
    const hourNum = parseInt(h, 10);
    const period = hourNum < 12 ? '오전' : '오후';
    const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
    return `${period} ${String(hour12).padStart(2, '0')}:${m}`;
};

const buildDateTime = (dateStr, h, m) => {
    if (!dateStr || !h || !m) return null;
    const timeStr = `${h}:${m}`;
    return moment(`${dateStr} ${timeStr}`, 'YYYY-MM-DD HH:mm').format();
};

export default function ScheduleEditScreen() {
    const navigation = useNavigation();
    const route = useRoute();

    const passedScheduleId = route.params?.scheduleId;
    const passedSchedule = route.params?.schedule;

    useLayoutEffect(() => {
        navigation.setOptions({
            headerBackTitleVisible: false,
            headerBackTitle: ' ',
        });
    }, [navigation]);
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState(moment().format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));

    const [startHour, setStartHour] = useState('09');
    const [startMinute, setStartMinute] = useState('00');
    const [endHour, setEndHour] = useState('10');
    const [endMinute, setEndMinute] = useState('00');

    const [memo, setMemo] = useState('');
    const [location, setLocation] = useState('');

    const [activeDatePicker, setActiveDatePicker] = useState(null); // 'start' | 'end' | null
    const [activeTimePicker, setActiveTimePicker] = useState(null); // 'start' | 'end' | null

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!passedSchedule) return;

        setTitle(passedSchedule.title ?? '');

        // start_at / end_at 파싱
        const start = passedSchedule.start_at || passedSchedule.alarm_time;
        const end = passedSchedule.end_at || passedSchedule.start_at;

        const startMoment = start ? moment(start) : null;
        const endMoment = end ? moment(end) : null;

        if (startMoment && startMoment.isValid()) {
            setStartDate(startMoment.format('YYYY-MM-DD'));
            setStartHour(startMoment.format('HH'));
            setStartMinute(startMoment.format('mm'));
        }

        if (endMoment && endMoment.isValid()) {
            setEndDate(endMoment.format('YYYY-MM-DD'));
            setEndHour(endMoment.format('HH'));
            setEndMinute(endMoment.format('mm'));
        }

        setMemo(passedSchedule.description ?? '');
        setLocation(passedSchedule.location ?? '');
    }, [passedSchedule]);

    const handleUpdate = async () => {
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
        if (!passedScheduleId) {
            Alert.alert('오류', '일정 정보를 불러오지 못했습니다. 다시 시도해 주세요.');
            return;
        }

        const startAt = buildDateTime(startDate, startHour, startMinute);
        const endAt = buildDateTime(endDate, endHour, endMinute);

        if (!startAt || !endAt) {
            Alert.alert('입력 오류', '날짜/시간 형식이 잘못되었습니다.');
            return;
        }

        if (!moment(endAt).isAfter(moment(startAt))) {
            Alert.alert(
                '입력 오류',
                '종료 일시가 시작 일시보다 같거나 빠를 수 없습니다.',
            );
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
                repeat_type: passedSchedule?.repeat_type ?? 'NONE',
                priority: passedSchedule?.priority ?? 'MEDIUM',
            };

            await updateScheduleApi({
                scheduleId: passedScheduleId,
                payload,
            });

            Alert.alert('성공', '일정이 수정되었습니다.');
            navigation.goBack();
        } catch (error) {
            const msg =
                error?.__normalized?.message || error.message || '알 수 없는 오류 발생';
            console.error('일정 수정 실패:', msg, error);
            Alert.alert('수정 실패', msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView edges={[]} className="flex-1 bg-white">
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
                    <View className="px-6 pt-6 pb-24">
                        <Text className="mb-2 text-lg text-gray-700 font-semibold">
                            일정 제목 *
                        </Text>
                        <TextInput
                            className="border border-gray-300 rounded-2xl px-5 py-4 text-lg text-gray-900"
                            placeholder="예: 병원 방문"
                            placeholderTextColor="#A0A0A0"
                            value={title}
                            onChangeText={setTitle}
                        />

                        <View className="mt-7">
                            <Text className="mb-2 text-lg text-gray-700 font-semibold">
                                시작 날짜 *
                            </Text>
                            <TouchableOpacity
                                className="border border-gray-300 rounded-2xl px-5 py-4 flex-row items-center justify-between"
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

                        <View className="mt-5">
                            <Text className="mb-2 text-lg text-gray-700 font-semibold">
                                종료 날짜 *
                            </Text>
                            <TouchableOpacity
                                className="border border-gray-300 rounded-2xl px-5 py-4 flex-row items-center justify-between"
                                onPress={() =>
                                    setActiveDatePicker(
                                        activeDatePicker === 'end' ? null : 'end',
                                    )
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

                        <View className="mt-8">
                            <Text className="mb-2 text-lg text-gray-700 font-semibold">
                                시작 시간 *
                            </Text>
                            <TouchableOpacity
                                className="border border-gray-300 rounded-2xl px-5 py-4 flex-row items-center justify-between"
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

                        <View className="mt-5">
                            <Text className="mb-2 text-lg text-gray-700 font-semibold">
                                종료 시간 *
                            </Text>
                            <TouchableOpacity
                                className="border border-gray-300 rounded-2xl px-5 py-4 flex-row items-center justify-between"
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

                        <View className="mt-8">
                            <Text className="mb-2 text-lg text-gray-700 font-semibold">
                                장소 (선택)
                            </Text>
                            <TextInput
                                className="border border-gray-300 rounded-2xl px-5 py-4 text-lg text-gray-900"
                                placeholder="예: 부경대학교 병원 물리치료실"
                                placeholderTextColor="#A0A0A0"
                                value={location}
                                onChangeText={setLocation}
                            />
                        </View>

                        <View className="mt-6">
                            <Text className="mb-2 text-lg text-gray-700 font-semibold">
                                메모 (선택)
                            </Text>
                            <TextInput
                                className="border border-gray-300 rounded-2xl px-5 py-4 text-lg text-gray-900"
                                placeholder="필요한 내용을 메모하세요"
                                placeholderTextColor="#A0A0A0"
                                value={memo}
                                onChangeText={setMemo}
                                multiline
                                style={{ minHeight: 110, textAlignVertical: 'top' }}
                            />
                        </View>
                    </View>
                </ScrollView>

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
                                    current={activeDatePicker === 'start' ? startDate : endDate}
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

                                <View className="flex-row bg-gray-50 rounded-xl px-3 py-2">
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
                                            style={{ width: '100%', height: 180, color: '#111827' }}
                                            itemStyle={{ fontSize: 22, color: '#111827' }}
                                        >
                                            {HOURS.map((h) => (
                                                <Picker.Item
                                                    key={h}
                                                    label={h}
                                                    value={h}
                                                    color="#111827"
                                                />
                                            ))}
                                        </Picker>
                                    </View>

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
                                            style={{ width: '100%', height: 180, color: '#111827' }}
                                            itemStyle={{ fontSize: 22, color: '#111827' }}
                                        >
                                            {MINUTES.map((m) => (
                                                <Picker.Item
                                                    key={m}
                                                    label={m}
                                                    value={m}
                                                    color="#111827"
                                                />
                                            ))}
                                        </Picker>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    className="mt-6 bg-teal-600 py-3 rounded-xl items-center"
                                    onPress={() => setActiveTimePicker(null)}
                                >
                                    <Text className="text-white font-bold">완료</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </TouchableOpacity>
                </Modal>

                <View className="p-4 border-t border-gray-200">
                    <TouchableOpacity
                        className={`rounded-2xl py-4 items-center ${
                            isSubmitting ? 'bg-gray-300' : 'bg-teal-600'
                        }`}
                        activeOpacity={0.8}
                        disabled={isSubmitting}
                        onPress={handleUpdate}
                    >
                        <Text className="text-white text-base font-bold">
                            {isSubmitting ? '저장 중...' : '수정하기'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
