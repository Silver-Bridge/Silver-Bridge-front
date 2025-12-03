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
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// 🔹 보호자-노인 연결 정보 + 감정 요약 API
import {
    getElderInfoApi,
    getEmotionSummaryCurrentMonth,   // ✅ 감정 월별 요약 API
} from '../../shared/api/guardian';

// 🔹 캘린더 API (userId 안 넘김, 인증 기반)
import {
    getCalendarDatesApi,
    getSchedulesByDateApi,
} from '../../shared/api/calendar';

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

const CALENDAR_HEIGHT = SCREEN_HEIGHT * 0.55;
const EMOJI_SIZE = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.09;
const DATE_FONT_SIZE = Math.max(15, Math.round(SCREEN_WIDTH * 0.04));
const CELL_MIN_HEIGHT = EMOJI_SIZE + DATE_FONT_SIZE * 3 + 24;
const CELL_VERTICAL_PADDING = EMOJI_SIZE * 0.6;

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

// 🔹 ★★ 데모용 목데이터 설정 ★★ ===============================================

// 👉 목데이터 사용 여부 (실제 배포/연동할 때는 false로 바꾸면 됨)
const USE_MOCK = true;

// 👉 목데이터를 적용할 연도 (올해에 맞게 수정)
const MOCK_YEAR = 2025;

// 👉 12월 1,2,3일 감정 목데이터
// key: 'YYYY-MM-DD', value: 감정코드(0~6 또는 HAPPY 등)
const MOCK_DECEMBER_EMOTIONS = {
    [`${MOCK_YEAR}-12-01`]: '0', // 긍정
    [`${MOCK_YEAR}-12-02`]: '3', // 불안
    [`${MOCK_YEAR}-12-03`]: '1', // 슬픔
};

// 👉 12월 1,2,3일 일정 목데이터 (이미 화면에서 쓰는 형태로 맞춰놓음)
const MOCK_DECEMBER_SCHEDULES = {
    [`${MOCK_YEAR}-12-01`]: [
        { id: 'm1', title: '내과 진료', time: '10:00 ~ 10:30', location: '부산 병원 1층' },
        { id: 'm2', title: '약 복용 알림', time: '20:00', location: '' },
    ],
    [`${MOCK_YEAR}-12-02`]: [
        { id: 'm3', title: '물리치료', time: '15:00 ~ 15:40', location: '재활의학과' },
    ],
    [`${MOCK_YEAR}-12-03`]: [
        { id: 'm4', title: '가벼운 산책', time: '09:30', location: '집 근처 공원' },
    ],
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
    const navigation = useNavigation();

    const [elderName, setElderName] = useState('');   // 🔹 어르신 이름 상태
    const [selectedDate, setSelectedDate] = useState(getTodayString());
    const [monthMarks, setMonthMarks] = useState({}); // 일정 있는 날짜
    const [emotionByDate, setEmotionByDate] = useState({}); // 🔹 날짜별 감정 코드
    const [scheduleList, setScheduleList] = useState([]);
    const [loadingMonth, setLoadingMonth] = useState(false);
    const [loadingSchedules, setLoadingSchedules] = useState(false);
    const [loadingEmotion, setLoadingEmotion] = useState(false);

    // 🔹 보호자 계정에 연결된 노인 정보 로딩
    useEffect(() => {
        (async () => {
            try {
                const info = await getElderInfoApi();
                // { elderId, elderName, elderPhone }
                setElderName(info?.elderName || '');
            } catch (e) {
                console.log('[GuardianCalendar] elder-info error', e?.message || e);
                setElderName('');
            }
        })();
    }, []);

    // 🔹 해당 월의 감정 요약 불러오기 (백엔드 응답 유연하게 처리)
    const loadEmotionForMonth = useCallback(async (year, month) => {
        try {
            setLoadingEmotion(true);

            // 🔸 데모: 12월 + 목데이터 사용 시, 백엔드 대신 목데이터 사용
            if (USE_MOCK && year === MOCK_YEAR && month === 12) {
                setEmotionByDate(MOCK_DECEMBER_EMOTIONS);
                return;
            }

            // 🔹 그 외에는 기존 백엔드 호출
            const list = await getEmotionSummaryCurrentMonth();

            const map = {};
            if (Array.isArray(list)) {
                list.forEach((item) => {
                    // 백엔드 응답에서 날짜/감정 필드 유연하게 뽑기
                    const dateStr =
                        item.date ||
                        item.targetDate ||
                        item.day ||
                        item.dateStr ||
                        item.date_string;

                    const emotionCode =
                        item.emotion ||
                        item.emotionCode ||
                        item.emotion_code ||
                        item.topEmotion;

                    if (dateStr && emotionCode !== undefined && emotionCode !== null) {
                        map[dateStr] = emotionCode;
                    }
                });
            }

            setEmotionByDate(map);
        } catch (e) {
            console.log('[GuardianCalendar] loadEmotionForMonth error', e);
            // 감정 데이터는 없어도 치명적이진 않으니 Alert는 생략
        } finally {
            setLoadingEmotion(false);
        }
    }, []);

    // 월별 일정 날짜
    const loadMonth = useCallback(
        async (year, month) => {
            try {
                setLoadingMonth(true);
                const dates = await getCalendarDatesApi({ year, month });
                const marks = {};
                dates.forEach((d) => {
                    marks[d] = true;
                });

                // 🔸 데모: 12월이면 목데이터 일정 날짜도 mark
                if (USE_MOCK && year === MOCK_YEAR && month === 12) {
                    Object.keys(MOCK_DECEMBER_SCHEDULES).forEach((d) => {
                        marks[d] = true;
                    });
                }

                setMonthMarks(marks);

                // 🔹 같은 타이밍에 감정 요약도 로딩
                await loadEmotionForMonth(year, month);
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
        },
        [loadEmotionForMonth],
    );

    // 날짜별 일정
    const loadSchedules = useCallback(async (date) => {
        try {
            setLoadingSchedules(true);

            // 🔸 데모: 12월 1~3일이면 목데이터 우선 사용
            if (USE_MOCK && date.startsWith(`${MOCK_YEAR}-12-`)) {
                const mock = MOCK_DECEMBER_SCHEDULES[date];
                if (mock) {
                    setScheduleList(mock);
                    return;
                }
            }

            // 🔹 나머지는 기존 백엔드 호출
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
        setSelectedDate(today);
        const [y, m] = today.split('-');
        loadMonth(Number(y), Number(m));
        loadSchedules(today);
    }, [loadMonth, loadSchedules]);

    // 화면 다시 포커스될 때(일정 추가 후 뒤로가기 등) 새로고침
    useFocusEffect(
        useCallback(() => {
            const [y, m] = selectedDate.split('-');
            loadMonth(Number(y), Number(m));
            loadSchedules(selectedDate);
        }, [selectedDate, loadMonth, loadSchedules]),
    );

    // 🔹 일정(mark) + 감정(emotionByDate) merge
    const getMarkedDates = () => {
        const marked = {};

        // 1) 일정이 있는 날짜 표시
        Object.keys(monthMarks).forEach((date) => {
            marked[date] = {
                marked: true,
                dotColor: '#4F46E5',
            };
        });

        // 2) 감정 데이터 합치기
        Object.keys(emotionByDate).forEach((date) => {
            if (!marked[date]) {
                marked[date] = {};
            }
            marked[date].emotion = emotionByDate[date];
        });

        // 3) 선택된 날짜 하이라이트
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

    // 🔹 보호자 일정 추가 화면으로 이동
    const handleAddSchedule = () => {
        navigation.navigate('GuardianScheduleAdd', { date: selectedDate });
    };

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-[#F3F4F6]">
            {/* 상단 헤더 */}
            <View className="px-5 pt-4 pb-3 flex-row justify-between items-center">
                <Text className="text-2xl font-bold text-gray-900">
                    {elderName ? `${elderName}님 일정 관리` : '대상자 일정 관리'}
                </Text>
                <TouchableOpacity onPress={handleAddSchedule}>
                    <Ionicons name="add-circle" size={28} color="#4F46E5" />
                </TouchableOpacity>
            </View>

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
                                textSectionTitleColor: '#111827',
                                'stylesheet.calendar.header': {
                                    dayTextAtIndex0: {
                                        color: '#EF4444',
                                    },
                                    dayTextAtIndex6: {
                                        color: '#3B82F6',
                                    },
                                },
                            }}
                            style={{
                                borderRadius: 24,
                                height: CALENDAR_HEIGHT,
                                paddingBottom: 4,
                            }}
                            dayComponent={({ date, state, marking }) => {
                                const disabled = state === 'disabled';
                                const isSelected = selectedDate === date.dateString;
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
                                            paddingBottom: CELL_VERTICAL_PADDING * 2,
                                            minHeight: CELL_MIN_HEIGHT,
                                        }}
                                    >
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

                        {(loadingMonth || loadingSchedules || loadingEmotion) && (
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
                                        {item.location ? ` | ${item.location}` : ''}
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
