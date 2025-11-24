// mobile/src/screens/guardian/GuardianCalendarScreen.js

import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Image,
    Dimensions,
    ScrollView,   // ✅ 전체 스크롤용
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';

// ==== 캘린더 한글 설정 =======================================================
LocaleConfig.locales.ko = {
    monthNames: [
        '1월', '2월', '3월', '4월', '5월', '6월',
        '7월', '8월', '9월', '10월', '11월', '12월',
    ],
    monthNamesShort: [
        '1월', '2월', '3월', '4월', '5월', '6월',
        '7월', '8월', '9월', '10월', '11월', '12월',
    ],
    dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
    dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
    today: '오늘',
};
LocaleConfig.defaultLocale = 'ko';

// 🔹 캘린더 API (userId 안 넘김, 인증 기반)
import {
    getCalendarDatesApi,
    getSchedulesByDateApi,
} from '../../shared/api/calendar';

// 오늘 날짜 "YYYY-MM-DD"
const getTodayString = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

// ==== 기기 크기 비율 기반 레이아웃 상수 =====================================
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 👉 [A] 날짜/이모티콘 크기·간격 조절 상수 (겹침 해결 + 기종별 대응)
const CALENDAR_HEIGHT = SCREEN_HEIGHT * 0.55; // 전체 달력 높이 (화면 높이의 55%)
const EMOJI_SIZE = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.09; // 이모티콘 크기
const DATE_FONT_SIZE = Math.max(15, Math.round(SCREEN_WIDTH * 0.04)); // 날짜 글씨 크기
const CELL_MIN_HEIGHT = EMOJI_SIZE + DATE_FONT_SIZE * 3 + 24; // 하루 셀 세로 최소 높이
const CELL_VERTICAL_PADDING  = EMOJI_SIZE * 0.6 ; // 하루 셀 위아래 여백(px)

// 🔹 포스터/테스트용 감정 목데이터
const MOCK_EMOTION_BY_DATE = {
    '2025-10-26': '3',
    '2025-10-27': '4',
    '2025-10-28': '6',
    '2025-10-29': '0',
    '2025-10-30': '2',
    '2025-10-31': '5',

    '2025-11-01': '6',
    '2025-11-02': '3',
    '2025-11-03': '4',
    '2025-11-04': '0',
    '2025-11-05': '2',
    '2025-11-06': '6',
    '2025-11-07': '1',
    '2025-11-08': '6',
    '2025-11-09': '3',
    '2025-11-10': '4',
    '2025-11-11': '6',
    '2025-11-12': '0',
    '2025-11-13': '2',
    '2025-11-14': '5',
    '2025-11-15': '6',
    '2025-11-16': '3',
    '2025-11-17': '4',
    '2025-11-18': '6',
    '2025-11-19': '0',
    '2025-11-20': '6',
    '2025-11-21': '2',
    '2025-11-22': '6',
};

// 🔹 감정 이모티콘 PNG 매핑
const getEmotionImage = (emotion) => {
    const code = (emotion || '').toString().toUpperCase();

    if (code === 'HAPPY' || code === 'POSITIVE' || code === '0') {
        return require('../../../assets/emotion_0_positive.png');
    }
    if (code === 'SAD' || code === '1') {
        return require('../../../assets/emotion_1_sadness.png');
    }
    if (code === 'ANGRY' || code === '2') {
        return require('../../../assets/emotion_2_anger.png');
    }
    if (code === 'ANXIOUS' || code === '3') {
        return require('../../../assets/emotion_3_anxiety.png');
    }
    if (code === 'SURPRISE' || code === '4') {
        return require('../../../assets/emotion_4_surprise.png');
    }
    if (code === 'DISGUST' || code === '5') {
        return require('../../../assets/emotion_5_disgust.png');
    }
    return require('../../../assets/emotion_6_neutral.png');
};

// 백엔드 일정 → 화면용
const mapSchedules = (list) => {
    if (!Array.isArray(list)) return [];

    const formatTime = (iso) => {
        if (!iso || typeof iso !== 'string') return '';
        const t = iso.split('T')[1];
        if (!t) return '';
        const [hh, mm] = t.split(':');
        return `${hh}:${mm}`;
    };

    return list.map((item, idx) => {
        const id = item.id ?? item.scheduleId ?? idx;
        const title = item.title ?? '일정';
        const start = item.start_at ?? item.startAt;
        const end = item.end_at ?? item.endAt;
        const timeLabel =
            start && end
                ? `${formatTime(start)} ~ ${formatTime(end)}`
                : start
                    ? formatTime(start)
                    : '';

        const location = item.location ?? item.place ?? '';

        return {
            id,
            title,
            time: timeLabel,
            location,
        };
    });
};

const GuardianCalendarScreen = () => {
    const [selectedDate, setSelectedDate] = useState(getTodayString());
    const [monthMarks, setMonthMarks] = useState({});
    const [scheduleList, setScheduleList] = useState([]);
    const [loadingMonth, setLoadingMonth] = useState(false);
    const [loadingSchedules, setLoadingSchedules] = useState(false);

    // 월별 일정 날짜
    const loadMonth = useCallback(async (year, month) => {
        try {
            setLoadingMonth(true);
            const dates = await getCalendarDatesApi({ year, month });
            const marks = {};
            dates.forEach((d) => {
                marks[d] = true;
            });
            setMonthMarks(marks);
        } catch (e) {
            console.log('[GuardianCalendar] loadMonth error', e);
            Alert.alert(
                '오류',
                e?.response?.data?.message ||
                e?.message ||
                '월별 일정을 불러오는 중 오류가 발생했습니다.',
            );
        } finally {
            setLoadingMonth(false);
        }
    }, []);

    // 날짜별 일정
    const loadSchedules = useCallback(async (date) => {
        try {
            setLoadingSchedules(true);
            const list = await getSchedulesByDateApi({ date });
            setScheduleList(mapSchedules(list));
        } catch (e) {
            console.log('[GuardianCalendar] loadSchedules error', e);
            Alert.alert(
                '오류',
                e?.response?.data?.message ||
                e?.message ||
                '일정을 불러오는 중 오류가 발생했습니다.',
            );
        } finally {
            setLoadingSchedules(false);
        }
    }, []);

    // 최초 로딩
    useEffect(() => {
        const today = getTodayString();
        const [y, m] = today.split('-');
        loadMonth(Number(y), Number(m));
        loadSchedules(today);
    }, [loadMonth, loadSchedules]);

    // mark + emotion merge
    const getMarkedDates = () => {
        const marked = {};

        Object.keys(monthMarks).forEach((date) => {
            const emotion = MOCK_EMOTION_BY_DATE[date] ?? null;
            marked[date] = {
                marked: true,
                dotColor: '#4F46E5',
                emotion,
            };
        });

        Object.keys(MOCK_EMOTION_BY_DATE).forEach((date) => {
            if (!marked[date]) {
                marked[date] = { emotion: MOCK_EMOTION_BY_DATE[date] };
            } else if (!marked[date].emotion) {
                marked[date].emotion = MOCK_EMOTION_BY_DATE[date];
            }
        });

        marked[selectedDate] = {
            ...(marked[selectedDate] || {}),
            selected: true,
            selectedColor: '#4F46E5',
            selectedTextColor: '#ffffff',
        };

        return marked;
    };

    const handleDayPress = (day) => {
        const date = day.dateString;
        setSelectedDate(date);
        loadSchedules(date);
    };

    const handleMonthChange = (monthObj) => {
        const { year, month } = monthObj;
        loadMonth(year, month);
    };

    const handleAddSchedule = () => {
        Alert.alert(
            '안내',
            '보호자용 일정 추가 화면은 추후 구현 예정입니다.\n(지금은 캘린더 조회만 가능합니다.)',
        );
    };

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-[#F3F4F6]">
            {/* 상단 헤더 */}
            <View className="px-5 pt-4 pb-3 flex-row justify-between items-center">
                <Text className="text-2xl font-bold text-gray-900">
                    박경림님 일정 관리
                </Text>
                <TouchableOpacity onPress={handleAddSchedule}>
                    <Ionicons name="add-circle" size={28} color="#4F46E5" />
                </TouchableOpacity>
            </View>

            {/* 👉 [C] 화면 전체 스크롤: 캘린더 + 일정 모두 ScrollView 안으로 */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
            >
                {/* 캘린더 카드 */}
                <View className="px-4 mt-2">
                    <View
                        className="bg-white rounded-3xl border border-gray-100 shadow-sm"
                        style={{ paddingVertical: 4, paddingHorizontal: 4 }}
                    >
                        <Calendar
                            current={selectedDate}
                            onDayPress={handleDayPress}
                            onMonthChange={handleMonthChange}
                            markedDates={getMarkedDates()}
                            monthFormat={'M월'}
                            hideExtraDays={false}
                            theme={{
                                todayTextColor: '#4F46E5',
                                arrowColor: '#4F46E5',
                                textDayFontWeight: '500',
                                textMonthFontWeight: 'bold',
                                textDayHeaderFontWeight: '500',
                                textDayFontSize: 13,
                                textDayHeaderFontSize: 11,

                                // ✅ 기본 요일(월~금) 색 – 거의 검정
                                textSectionTitleColor: '#111827',

                                // ✅ 요일 줄 스타일 + 요일별 개별 색
                                'stylesheet.calendar.header': {
                                    // index 0 = 일요일 → 빨간색
                                    dayTextAtIndex0: {
                                        color: '#EF4444',
                                    },
                                    // index 6 = 토요일 → 파란색
                                    dayTextAtIndex6: {
                                        color: '#3B82F6',
                                    },
                                },

                            }}
                            style={{
                                borderRadius: 24,
                                height: CALENDAR_HEIGHT, // 🔥 기기 비율로 달력 높이
                                paddingBottom: 4,
                            }}
                            // 👉 [B] 날짜/이모티콘 배치 부분 (겹침 수정은 여기서)
                            dayComponent={({ date, state, marking }) => {
                                const disabled = state === 'disabled';
                                const isSelected = selectedDate === date.dateString;

                                // ✅ 해당 달이 아니면 emotion도 강제로 없앰
                                const emotion = disabled ? null : marking?.emotion;
                                const emoImg = emotion ? getEmotionImage(emotion) : null;

                                return (
                                    <TouchableOpacity
                                        onPress={() => handleDayPress(date)}
                                        activeOpacity={0.85}
                                        style={{
                                            flex: 1,
                                            alignItems: 'center',
                                            justifyContent: 'flex-start',
                                             paddingTop: 4,
                                            paddingBottom: CELL_VERTICAL_PADDING* 2,
                                            minHeight: CELL_MIN_HEIGHT,
                                        }}
                                    >
                                        {/* 날짜 숫자 */}
                                        <Text
                                            style={{
                                                fontSize: DATE_FONT_SIZE,
                                                fontWeight: '700',
                                                marginBottom: 4,
                                                color: disabled
                                                    ? '#D1D5DB'
                                                    : isSelected
                                                        ? '#4F46E5'
                                                        : '#374151',
                                            }}
                                        >
                                            {date.day}
                                        </Text>

                                        {/* ✅ 현재 달일 때만 이모티콘/동그라미 표시 */}
                                        {!disabled && (
                                            emoImg ? (
                                                <Image
                                                    source={emoImg}
                                                    style={{
                                                        width: EMOJI_SIZE,
                                                        height: EMOJI_SIZE,
                                                    }}
                                                    resizeMode="contain"
                                                />
                                            ) : (
                                                <View
                                                    style={{
                                                        width: EMOJI_SIZE * 0.9,
                                                        height: EMOJI_SIZE * 0.9,
                                                        borderRadius: (EMOJI_SIZE * 0.9) / 2,
                                                        borderWidth: 1.6,
                                                        borderColor: isSelected ? '#4F46E5' : '#E5E7EB',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                />
                                            )
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                        />

                        {(loadingMonth || loadingSchedules) && (
                            <View className="mt-2 items-center">
                                <ActivityIndicator size="small" />
                                <Text className="text-xs text-gray-400 mt-1">
                                    데이터를 불러오는 중입니다…
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* 선택된 날짜 일정 리스트 */}
                <View className="mt-4 bg-white rounded-t-3xl px-5 pt-6 pb-2 shadow-lg">
                    <View className="flex-row justify-between items-end mb-4">
                        <Text className="text-lg font-bold text-gray-900">
                            {selectedDate} 일정
                        </Text>
                    </View>

                    {scheduleList.length > 0 ? (
                        scheduleList.map((item) => (
                            <View
                                key={item.id}
                                className="bg-white p-4 rounded-2xl mb-3 flex-row justify-between items-center border border-gray-100 shadow-sm"
                            >
                                <View className="flex-1">
                                    <Text className="text-base font-bold text-gray-900 mb-1">
                                        {item.title}
                                    </Text>
                                    <Text className="text-sm text-gray-500">
                                        {item.time}
                                        {item.location
                                            ? ` | ${item.location}`
                                            : ''}
                                    </Text>
                                </View>
                                <TouchableOpacity>
                                    <Ionicons
                                        name="ellipsis-vertical"
                                        size={20}
                                        color="#9CA3AF"
                                    />
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <View className="items-center justify-center py-10">
                            <Text className="text-gray-400">
                                등록된 일정이 없습니다.
                            </Text>
                            <TouchableOpacity
                                onPress={handleAddSchedule}
                                className="mt-2"
                            >
                                <Text className="text-indigo-600 font-medium">
                                    대신 일정 등록하기
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default GuardianCalendarScreen;
