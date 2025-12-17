// mobile/src/screens/calendar/CalendarScreen.js

import React, {
    useState,
    useMemo,
    useCallback,
} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    FlatList,
    ActivityIndicator,
    Alert,
} from 'react-native';
import {
    useNavigation,
    useFocusEffect,
} from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import moment from 'moment';
import 'moment/locale/ko';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
    getCalendarDatesApi,
    getSchedulesByDateApi,
    deleteScheduleApi,
} from '../../shared/api/calendar';

moment.locale('ko');

// 시간 포맷
const formatTimeRange = (startRaw, endRaw) => {
    const startM = startRaw ? moment.parseZone(startRaw) : null;
    const endM = endRaw ? moment.parseZone(endRaw) : null;

    if (startM?.isValid() && endM?.isValid()) {
        return `${startM.format('HH:mm')} ~ ${endM.format('HH:mm')}`;
    } else if (startM?.isValid()) {
        return startM.format('HH:mm');
    } else if (endM?.isValid()) {
        return endM.format('HH:mm');
    }
    return '시간 정보 없음';
};


const EventItem = ({ event, onPress, onDelete }) => {
    // ✅ 표시용 시간은 일정 시작/종료 시간만 사용
    const startRaw = event.start_at || event.startAt || null;
    const endRaw = event.end_at || event.endAt || null;

    const timeStr = formatTimeRange(startRaw, endRaw);
    const color = event.color || '#0D9488';

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            className="mb-4 rounded-3xl bg-white border border-gray-200"
            style={{
                paddingHorizontal: 18,
                paddingVertical: 14,
            }}
            onPress={() => onPress?.(event)}
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                    <Text
                        className="text-gray-700 font-bold mb-1"
                        style={{ fontSize: 19 }}
                    >
                        {timeStr}
                    </Text>
                    <Text
                        className="text-gray-900 font-extrabold"
                        numberOfLines={2}
                        style={{ fontSize: 21, lineHeight: 26 }}
                    >
                        {event.title}
                    </Text>

                    {!!event.location && (
                        <View className="mt-2 flex-row items-center">
                            <Ionicons
                                name="location-outline"
                                size={18}
                                color="#6B7280"
                            />
                            <Text
                                className="ml-1 text-gray-700"
                                numberOfLines={1}
                                style={{ fontSize: 15 }}
                            >
                                {event.location}
                            </Text>
                        </View>
                    )}
                    {!!event.description && (
                        <Text
                            className="mt-2 text-gray-700"
                            numberOfLines={3}
                            style={{ fontSize: 15, lineHeight: 20 }}
                        >
                            {event.description}
                        </Text>
                    )}
                </View>

                <TouchableOpacity
                    onPress={() => onDelete?.(event)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="w-10 h-10 rounded-full border border-gray-300 items-center justify-center"
                    activeOpacity={0.85}
                >
                    <Ionicons name="trash-outline" size={22} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const AddScheduleButton = ({ navigation }) => (
    <View className="items-center pt-4 pb-2">
        <TouchableOpacity
            className="flex-row items-center bg-teal-600 py-3 px-5 rounded-full shadow-md"
            onPress={() => navigation.navigate('ScheduleAdd')}
            activeOpacity={0.9}
        >
            <Text className="text-3xl text-white mr-2">＋</Text>
            <Text className="text-lg text-white font-bold">
                일정 추가하기
            </Text>
        </TouchableOpacity>
    </View>
);

export default function CalendarScreen() {
    const navigation = useNavigation();
    const today = moment().format('YYYY-MM-DD');

    const [currentMonth, setCurrentMonth] = useState(moment(today));
    const [selectedDate, setSelectedDate] = useState(today);

    const [markedDots, setMarkedDots] = useState({});
    const [selectedEvents, setSelectedEvents] = useState([]);

    const [loadingDots, setLoadingDots] = useState(false);
    const [loadingEvents, setLoadingEvents] = useState(false);

    const loadDotsForMonth = useCallback(
        async (monthToLoad) => {
            setLoadingDots(true);
            try {
                const year = monthToLoad.year();
                const month = monthToLoad.month() + 1;

                const dates = await getCalendarDatesApi({
                    year,
                    month,
                });

                const dots = {};
                dates.forEach((dateStr) => {
                    dots[dateStr] = { dots: [{ color: '#0D9488' }] };
                });
                setMarkedDots(dots);
            } catch (e) {
                console.error(
                    'Failed to load calendar dates:',
                    e.message || e,
                );
            } finally {
                setLoadingDots(false);
            }
        },
        [],
    );

    const loadEventsForDate = useCallback(
        async (date) => {
            setLoadingEvents(true);
            setSelectedEvents([]);
            try {
                const events = await getSchedulesByDateApi({ date });

                // 🔹 start_at 기준으로 정렬 (타임존 유지)
                events.sort((a, b) => {
                    const aTime = a.start_at || a.startAt || '';
                    const bTime = b.start_at || b.startAt || '';
                    const aM = aTime ? moment.parseZone(aTime) : null;
                    const bM = bTime ? moment.parseZone(bTime) : null;
                    return (aM?.valueOf() || 0) - (bM?.valueOf() || 0);
                });

                setSelectedEvents(events);
            } catch (e) {
                console.error(
                    'Failed to load schedules for date:',
                    e.message || e,
                );
            } finally {
                setLoadingEvents(false);
            }
        },
        [],
    );

    const handleEditEvent = (event) => {
        if (!event?.id) return;
        navigation.navigate('ScheduleEdit', {
            scheduleId: event.id,
            schedule: event,
        });
    };

    const handleDeleteEvent = (event) => {
        if (!event?.id) return;

        Alert.alert(
            '일정 삭제',
            `'${event.title}' 일정을 삭제할까요?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteScheduleApi({
                                scheduleId: event.id,
                            });
                            await loadEventsForDate(selectedDate);
                            await loadDotsForMonth(currentMonth);
                        } catch (e) {
                            Alert.alert(
                                '삭제 실패',
                                e?.__normalized?.message ||
                                e?.message ||
                                '일정 삭제 중 오류가 발생했습니다.',
                            );
                        }
                    },
                },
            ],
        );
    };

    useFocusEffect(
        useCallback(() => {
            loadDotsForMonth(currentMonth);
            loadEventsForDate(selectedDate);
        }, [
            selectedDate,
            currentMonth,
            loadDotsForMonth,
            loadEventsForDate,
        ]),
    );

    const markedDates = useMemo(() => {
        const marked = { ...markedDots };
        marked[selectedDate] = {
            ...marked[selectedDate],
            selected: true,
            selectedColor: '#0D9488',
            marked: !!marked[selectedDate],
        };
        return marked;
    }, [selectedDate, markedDots]);

    const todayStr = today;
    const goToToday = () => {
        const todayMoment = moment(todayStr);
        setSelectedDate(todayStr);

        if (!todayMoment.isSame(currentMonth, 'month')) {
            setCurrentMonth(todayMoment);
        } else {
            loadEventsForDate(todayStr);
        }
    };

    const handleMonthChange = (month) => {
        const newMonth = moment(month.dateString);
        setCurrentMonth(newMonth);
        loadDotsForMonth(newMonth);
    };

    const handleDayPress = (day) => {
        setSelectedDate(day.dateString);
        loadEventsForDate(day.dateString);
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
                <Text className="font-extrabold text-gray-900" style={{ fontSize: 24 }}>
                    {currentMonth.format('YYYY년 MM월')}
                </Text>

                <TouchableOpacity
                    onPress={goToToday}
                    className="px-3 py-2 bg-gray-100 rounded-full"
                    activeOpacity={0.9}
                >
                    <Text className="text-sm text-gray-800">오늘</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1">
                <View className="px-3 pt-2">
                    <Calendar
                        key={currentMonth.format('YYYY-MM')}
                        current={currentMonth.format('YYYY-MM-DD')}
                        hideHeader={true}
                        onDayPress={handleDayPress}
                        onMonthChange={handleMonthChange}
                        markedDates={markedDates}
                        markingType="multi-dot"
                        theme={{
                            calendarBackground: '#ffffff',
                            textDayHeaderFontWeight: '500',
                            textDayHeaderFontSize: 15,
                            todayTextColor: '#0D9488',
                            selectedDayBackgroundColor: '#0D9488',
                            selectedDayTextColor: '#ffffff',
                            arrowColor: '#0D9488',
                            textDayFontWeight: '500',
                            textDayFontSize: 18,
                            dayTextColor: '#333333',
                            textDisabledColor: '#cccccc',
                        }}
                    />
                </View>

                <View className="mt-6 px-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text
                            className="font-extrabold text-gray-900"
                            style={{ fontSize: 22 }}
                        >
                            {moment(selectedDate).format('MM월 DD일 (ddd)')} 일정 (
                            {selectedEvents.length}개)
                        </Text>
                    </View>

                    <View className="border border-gray-200 rounded-3xl p-4 bg-gray-50/70">
                        {loadingEvents ? (
                            <View className="items-center py-4">
                                <ActivityIndicator />
                            </View>
                        ) : selectedEvents.length > 0 ? (
                            <FlatList
                                data={selectedEvents}
                                keyExtractor={(item) =>
                                    item.id?.toString() ||
                                    `${item.title}-${item.start_at}-${item.end_at}`
                                }
                                renderItem={({ item }) => (
                                    <EventItem
                                        event={item}
                                        onPress={handleEditEvent}
                                        onDelete={handleDeleteEvent}
                                    />
                                )}
                                scrollEnabled={false}
                            />
                        ) : (
                            <View className="items-center py-6">
                                <Text
                                    className="text-gray-500"
                                    style={{ fontSize: 16 }}
                                >
                                    선택한 날짜에 일정이 없습니다.
                                </Text>
                            </View>
                        )}

                        <AddScheduleButton navigation={navigation} />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
