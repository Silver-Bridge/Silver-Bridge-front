// mobile/src/screens/guardian/GuardianHomeScreen.js
import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

import {
    getTodayTopEmotion,
    getLastWeekEmotionSummary,
    getGuardianTodayScheduleApi,
    getElderInfoApi,
} from '../../shared/api/guardian';

// ==== 시간 파싱/포맷 유틸 (노인 홈과 동일) ====
function parseDateLoose(s) {
    if (!s) return null;
    let t = String(s).trim().replace(' ', 'T');
    t = t.replace(/\.\d{6}$/, (m) => '.' + m.slice(1, 4)); // .123456 -> .123
    const d = new Date(t);
    return isNaN(d.getTime()) ? null : d;
}

function fmtHHmm(d) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}

// ISO 문자열에서 HH:mm 부분만 추출
const extractHHmm = (iso) => {
    if (!iso) return '';
    const str = String(iso);

    const m = str.match(/T(\d{2}:\d{2})/);
    if (m) return m[1];

    const m2 = str.match(/(\d{2}:\d{2})/);
    if (m2) return m2[1];

    return '';
};

// ===== 🔥 데모용 목데이터 설정 =====
const USE_MOCK = true;

// 👉 주간 감정 목데이터: **딱 3일만** (12/01, 12/02, 12/03)
const MOCK_WEEKLY_EMOTION = [
    { key: 'd1', day: '월', date: '12.01', emotion: '0' }, // 기쁨
    { key: 'd2', day: '화', date: '12.02', emotion: '3' }, // 불안
    { key: 'd3', day: '수', date: '12.03', emotion: '1' }, // 슬픔
];
// 👉 오늘 일정 목데이터는 **안 씀** (그대로 빈 배열 or 실제 API)

// ---------------- 감정 스타일 & 이미지 매핑 -----------------

// 텍스트/색상/그라데이션
const getEmotionStyle = (emotion) => {
    const code = (emotion || '').toString().toUpperCase();

    switch (code) {
        // 0: HAPPY / POSITIVE
        case 'HAPPY':
        case 'POSITIVE':
        case '0':
            return {
                label: '기쁨',
                color: '#FBBF24',
                gradient: ['#FFE082', '#FFB300'],
            };
        // 1: SAD
        case 'SAD':
        case '1':
            return {
                label: '슬픔',
                color: '#60A5FA',
                gradient: ['#BFDBFE', '#3B82F6'],
            };
        // 2: ANGRY
        case 'ANGRY':
        case '2':
            return {
                label: '분노',
                color: '#F97373',
                gradient: ['#FED7D7', '#F97373'],
            };
        // 3: ANXIOUS
        case 'ANXIOUS':
        case '3':
            return {
                label: '불안',
                color: '#A78BFA',
                gradient: ['#E9D5FF', '#8B5CF6'],
            };
        // 4: SURPRISE
        case 'SURPRISE':
        case '4':
            return {
                label: '놀람',
                color: '#F472B6',
                gradient: ['#FBCFE8', '#EC4899'],
            };
        // 5: DISGUST
        case 'DISGUST':
        case '5':
            return {
                label: '혐오',
                color: '#84CC16',
                gradient: ['#D9F99D', '#84CC16'],
            };
        // 6: NEUTRAL & 기본
        case 'NEUTRAL':
        case '6':
        default:
            return {
                label: '평온함',
                color: '#22C55E',
                gradient: ['#BBF7D0', '#22C55E'],
            };
    }
};

// 이모티콘 PNG
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

// 오늘 감정 매핑
const mapTodayEmotion = (raw) => {
    if (!raw) {
        return {
            name: '보호 대상자',
            emotionCode: null,
            summary: '아직 오늘 대화 데이터가 없어요.',
        };
    }

    const name =
        raw.elderName ||
        raw.elder?.name ||
        raw.targetName ||
        raw.userName ||
        raw.name ||
        '보호 대상자';

    return {
        name,
        emotionCode:
            raw.emotion || raw.emotionType || raw.topEmotion || raw.code || null,
        summary:
            raw.summary ||
            raw.message ||
            raw.description ||
            '오늘은 비교적 평온한 하루를 보내셨습니다.',
    };
};

// 최근 7일용 map 함수는 그대로 둠 (실제 API 쓸 때 사용)
// (지금은 USE_MOCK=true니까 안 타도 됨)
const mapWeeklyEmotion = (list) => {
    const daysKo = ['일', '월', '화', '수', '목', '금', '토'];

    const mapByDate = new Map();
    if (Array.isArray(list)) {
        list.forEach((item) => {
            const key =
                (item.date || item.dateLabel || '').toString().slice(0, 10); // YYYY-MM-DD
            mapByDate.set(key, {
                emotion: item.emotion || item.topEmotion || item.code || null,
            });
        });
    }

    const result = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const key = `${yyyy}-${mm}-${dd}`;

        const weekDay = daysKo[d.getDay()];
        const dateLabel = `${mm}.${dd}`;
        const matched = mapByDate.get(key);

        result.push({
            key,
            day: weekDay,
            date: dateLabel,
            emotion: matched?.emotion ?? null,
        });
    }

    return result;
};

// 오늘 일정 매핑 (연결된 보호 대상자 일정)
const mapTodaySchedules = (list) => {
    if (!Array.isArray(list)) return [];

    console.log('[GuardianHome] raw schedules =', list);

    const mapped = list.map((item) => {
        const startRaw =
            item.start ??
            item.startTime ??
            item.startAt ??
            item.start_at ??
            '';
        const endRaw =
            item.end ??
            item.endTime ??
            item.endAt ??
            item.end_at ??
            '';

        const startHHmm = extractHHmm(startRaw);
        const endHHmm = extractHHmm(endRaw);

        const time =
            startHHmm && endHHmm ? `${startHHmm} ~ ${endHHmm}` : '';

        return {
            id: item.id ?? item.scheduleId,
            title: item.title || item.name || '일정',
            start: startRaw,
            end: endRaw,
            time,
            place: item.location || item.place || item.memo || '',
        };
    });

    console.log('[GuardianHome] mapped schedules (normalized) =', mapped);
    return mapped;
};

// 보호자 아바타
const getGuardianAvatarSource = (genderRaw) => {
    let gender = genderRaw;
    if (typeof genderRaw === 'boolean') {
        gender = genderRaw ? 'male' : 'female';
    }
    const g = (gender || '').toString().toLowerCase();

    if (g === 'm' || g === 'male' || g === '남' || g === '남성' || g === 'true') {
        return require('../../../assets/avatar_guardian_male.png');
    }
    return require('../../../assets/avatar_guardian_female.png');
};

// 노인 홈의 ScheduleRow 그대로 사용
function ScheduleRow({ item, done, onToggle }) {
    const accent =
        item?.color && item.color !== 'black' ? item.color : '#10b981';

    const startD = parseDateLoose(item.start);
    const endD = parseDateLoose(item.end);

    let timeText = '';
    if (startD && endD) {
        timeText = `${fmtHHmm(startD)} ~ ${fmtHHmm(endD)}`;
    } else if (item.time) {
        timeText = item.time;
    } else if (item.start || item.end) {
        timeText = `${item.start || ''}${item.end ? ` ~ ${item.end}` : ''}`;
    }

    return (
        <View
            className="rounded-xl bg-white border border-gray-200 px-4 py-3 mb-2"
            style={done ? { opacity: 0.55 } : undefined}
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-2">
                    {/* 상단: 포인트 점 + 제목 */}
                    <View className="flex-row items-center mb-1.5">
                        <View
                            style={{ backgroundColor: accent }}
                            className="w-1.5 h-1.5 rounded-full mr-2"
                        />
                        <Text
                            className="text-[14px] font-semibold text-gray-900"
                            style={
                                done
                                    ? {
                                        textDecorationLine: 'line-through',
                                        textDecorationColor: '#9CA3AF',
                                    }
                                    : undefined
                            }
                            numberOfLines={1}
                        >
                            {item.title}
                        </Text>
                    </View>

                    {/* 중앙: 시간 */}
                    <Text
                        className="text-[18px] font-extrabold tracking-tight text-gray-900"
                        style={
                            done
                                ? {
                                    textDecorationLine: 'line-through',
                                    textDecorationColor: '#9CA3AF',
                                }
                                : undefined
                        }
                    >
                        {timeText}
                    </Text>

                    {/* 하단: 장소 */}
                    {!!item.place && (
                        <View className="mt-1.5 flex-row items-center">
                            <Ionicons
                                name="location-outline"
                                size={14}
                                color="#6B7280"
                            />
                            <Text
                                className="ml-1 text-[12px] text-gray-700"
                                numberOfLines={1}
                            >
                                {item.place}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}

const GuardianHomeScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    the [refreshing, setRefreshing] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    // 보호 대상자(노인)
    const [elderName, setElderName] = useState('보호 대상자');
    const [todayEmotionCode, setTodayEmotionCode] = useState(null);
    const [todayEmotionSummary, setTodayEmotionSummary] = useState('');

    // 보호자
    const [guardianName, setGuardianName] = useState('보호자');
    const [guardianGender, setGuardianGender] = useState(null);

    const [weeklyEmotion, setWeeklyEmotion] = useState([]);
    const [todaySchedules, setTodaySchedules] = useState([]);
    const [doneIds, setDoneIds] = useState(new Set());

    // USER_INFO 에서 보호자 이름/성별
    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem('USER_INFO');
                const u = raw ? JSON.parse(raw) : null;
                setGuardianName(u?.name || '보호자');
                setGuardianGender(u?.gender ?? u?.sex ?? u?.genderType ?? null);
            } catch (e) {
                console.log('[GuardianHome] USER_INFO load error', e);
            }
        })();
    }, []);

    const loadAll = useCallback(async () => {
        setErrorMsg(null);
        try {
            if (!refreshing) setLoading(true);

            // 🔹 오늘 감정, 주간 감정, 오늘 일정, 노인 정보 한 번에 가져오기
            const [todayRes, weeklyRes, scheduleRes, elderRes] = await Promise.all([
                getTodayTopEmotion().catch((e) => {
                    console.log('[GuardianHome] todayTopEmotion error', e);
                    return null;
                }),
                getLastWeekEmotionSummary().catch((e) => {
                    console.log('[GuardianHome] weeklyEmotion error', e);
                    return [];
                }),
                getGuardianTodayScheduleApi().catch((e) => {
                    console.log('[GuardianHome] todaySchedules error', e);
                    return [];
                }),
                getElderInfoApi().catch((e) => {
                    console.log('[GuardianHome] elderInfo error', e);
                    return null;
                }),
            ]);

            const mappedToday = mapTodayEmotion(todayRes);

            // 🔹 elder-info API에서 이름 우선 사용
            const elderNameFromApi =
                elderRes?.elderName ||
                elderRes?.name ||
                elderRes?.targetName ||
                null;

            setElderName((prev) => {
                if (elderNameFromApi) return elderNameFromApi;
                if (mappedToday.name && mappedToday.name !== '보호 대상자') {
                    return mappedToday.name;
                }
                return prev;
            });

            setTodayEmotionCode(mappedToday.emotionCode);
            setTodayEmotionSummary(mappedToday.summary);

            // 🔥 목데이터 사용 여부
            if (USE_MOCK) {
                // → 주간 감정: 3일짜리 목데이터
                setWeeklyEmotion(MOCK_WEEKLY_EMOTION);

                // → 일정은 목데이터 안 쓰고, 그냥 비워둠 (화면에는 "등록된 일정이 없습니다" 뜸)
                setTodaySchedules([]);
            } else {
                // → 실제 API 데이터 사용
                if (Array.isArray(weeklyRes)) {
                    setWeeklyEmotion(mapWeeklyEmotion(weeklyRes));
                } else {
                    setWeeklyEmotion([]);
                }
                setTodaySchedules(mapTodaySchedules(scheduleRes));
            }

            setDoneIds(new Set());
        } catch (e) {
            console.log('[GuardianHome] loadAll fatal', e);
            setErrorMsg(
                e?.response?.data?.message ||
                e?.message ||
                '데이터를 불러오는 중 오류가 발생했습니다.',
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [refreshing]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const onRefresh = () => {
        setRefreshing(true);
        loadAll();
    };

    const toggleDone = (id) => {
        setDoneIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const { color, label, gradient } = getEmotionStyle(todayEmotionCode);
    const emotionImage = getEmotionImage(todayEmotionCode);
    const avatarSource = getGuardianAvatarSource(guardianGender);

    // 🔹 헤더 문구: elderName 반영
    const moodTitle = elderName
        ? `${elderName}님의 오늘 기분`
        : '오늘 보호 대상자의 기분';

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-[#f7f8f7]">
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingBottom: 8,
                    paddingHorizontal: 20,
                }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* 로딩 */}
                {loading && !refreshing ? (
                    <View className="mt-4 mb-4 items-center justify-center">
                        <ActivityIndicator size="large" />
                        <Text className="mt-3 text-gray-500 text-sm">
                            보호 대상자의 데이터를 불러오는 중입니다…
                        </Text>
                    </View>
                ) : null}

                {/* 에러 */}
                {errorMsg && (
                    <View className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-4">
                        <Text className="text-red-600 text-sm">{errorMsg}</Text>
                    </View>
                )}

                {/* 보호자 헤더 */}
                <View className="flex-row items-center mb-6">
                    <View className="w-12 h-12 rounded-full bg-white mr-3 items-center justify-center border border-gray-200">
                        <Image
                            source={avatarSource}
                            style={{ width: 40, height: 40 }}
                            resizeMode="contain"
                        />
                    </View>
                    <View>
                        <Text className="text-base font-semibold text-gray-800">
                            {guardianName} 보호자님
                        </Text>
                    </View>
                </View>

                {/* ===== 상단 감정 섹션 ===== */}
                <View className="items-center mb-8">
                    {/* 제목: elderName 반영 */}
                    <Text
                        style={{ fontSize: 18, fontWeight: '800' }}
                        className="text-gray-900 mb-3"
                    >
                        {moodTitle}
                    </Text>

                    {/* 원형 그라데이션 링 */}
                    <View
                        style={{
                            width: 190,
                            height: 190,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 14,
                        }}
                    >
                        <LinearGradient
                            colors={gradient}
                            style={{
                                position: 'absolute',
                                width: 200,
                                height: 200,
                                borderRadius: 100,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <View
                                style={{
                                    width: 160,
                                    height: 160,
                                    borderRadius: 80,
                                    backgroundColor: '#f7f8f7',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Image
                                    source={emotionImage}
                                    style={{ width: 120, height: 120 }}
                                    resizeMode="contain"
                                />
                            </View>
                        </LinearGradient>
                    </View>

                    {/* 감정 알약 버튼 */}
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={{
                            paddingHorizontal: 32,
                            paddingVertical: 10,
                            borderRadius: 9999,
                            backgroundColor: gradient[1] || '#10b981',
                            shadowColor: '#000000',
                            shadowOpacity: 0.15,
                            shadowRadius: 6,
                            shadowOffset: { width: 0, height: 3 },
                            elevation: 3,
                        }}
                    >
                        <Text
                            style={{ fontSize: 16, fontWeight: '700' }}
                            className="text-white"
                        >
                            {label}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 주간 감정 변화 */}
                <View className="w-full mb-6">
                    <Text className="text-lg font-bold text-gray-800 mb-3 px-1">
                        주간 감정 변화
                    </Text>
                    <View className="bg-white rounded-3xl p-4 flex-row justify-between shadow-sm border border-gray-100">
                        {weeklyEmotion.map((item) => {
                            const hasEmotion = !!item.emotion;
                            const emoImg = hasEmotion
                                ? getEmotionImage(item.emotion)
                                : null;
                            const { color: emoColor } = getEmotionStyle(
                                item.emotion,
                            );

                            return (
                                <View
                                    key={item.key}
                                    className="items-center space-y-2"
                                >
                                    <Text className="text-gray-400 text-xs mb-1">
                                        {item.day}
                                    </Text>
                                    {hasEmotion ? (
                                        <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center">
                                            <Image
                                                source={emoImg}
                                                style={{ width: 28, height: 28 }}
                                                resizeMode="contain"
                                            />
                                        </View>
                                    ) : (
                                        <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                                            <View
                                                style={{ backgroundColor: emoColor }}
                                                className="w-2 h-2 rounded-full"
                                            />
                                        </View>
                                    )}
                                    <Text className="text-xs font-medium text-gray-600">
                                        {item.date}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* 오늘의 일정 */}
                <View className="w-full mb-20">
                    <View className="flex-row justify-between items-center mb-3 px-1">
                        <Text className="text-lg font-bold text-gray-800">
                            오늘의 일정
                        </Text>
                    </View>

                    <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                        {todaySchedules.length > 0 ? (
                            todaySchedules.map((schedule) => (
                                <ScheduleRow
                                    key={schedule.id}
                                    item={schedule}
                                    done={doneIds.has(schedule.id)}
                                    onToggle={toggleDone}
                                />
                            ))
                        ) : (
                            <View className="items-center justify-center py-3">
                                <Text className="text-gray-400">
                                    등록된 일정이 없습니다.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default GuardianHomeScreen;
