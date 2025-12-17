// mobile/src/screens/HomeScreen.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    useWindowDimensions,
    RefreshControl,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

import { getSchedulesByDateApi } from '../shared/api/calendar';
import { getAssistantSuggestionsApi } from '../shared/api/home';
import {useAlarmPolling} from "../shared/hooks/useAlarmPolling";

function parseDateKeepOffset(s) {
    if (!s) return null;
    const m = moment.parseZone(String(s));
    return m.isValid() ? m : null;
}
function fmtHHmmMoment(m) {
    return m.format('HH:mm');
}

function useResponsiveGaps() {
    const { width } = useWindowDimensions();
    const compact = width < 380;
    const tablet = width >= 768;
    return useMemo(
        () => ({
            compact,
            tablet,
            maxW: tablet ? 840 : 680,
            pageTop: compact ? 4 : 8,
            pageBottom: compact ? 16 : 24,
            cardGap: compact ? 10 : 14,
            cardPx: compact ? 14 : 18,
            cardPy: compact ? 12 : 16,
            titleSize: compact ? 22 : 26,
            pillGap: compact ? 8 : 10,
            topbarPx: compact ? 12 : 16,
        }),
        [width, compact, tablet]
    );
}

function getElderlyAvatarSource(genderRaw) {
    let gender = genderRaw;

    if (typeof genderRaw === 'boolean') {
        gender = genderRaw ? 'male' : 'female';
    }

    if (!gender) {
        return require('../../assets/avatar_elderly_female.png');
    }

    const g = String(gender).toLowerCase();

    if (g === 'm' || g === 'male' || g === '남' || g === '남성' || g === 'true') {
        return require('../../assets/avatar_elderly_male.png');
    }

    return require('../../assets/avatar_elderly_female.png');
}

function TopBar({ name, gender, ui }) {
    const avatar = ui.tablet ? 52 : ui.compact ? 40 : 46;
    const nameFs = ui.tablet ? 19 : ui.compact ? 16 : 18;
    const iconSz = ui.tablet ? 26 : ui.compact ? 22 : 24;
    const bottomSpace = ui.cardGap + 6;

    const avatarSource = getElderlyAvatarSource(gender);

    return (
        <View
            style={{ paddingHorizontal: ui.topbarPx, marginBottom: bottomSpace }}
            className="w-full self-center pb-1"
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <View
                        style={{
                            width: avatar,
                            height: avatar,
                            borderRadius: avatar / 2,
                            backgroundColor: '#fff',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                            borderWidth: 1,
                            borderColor: '#e5e7eb',
                        }}
                    >
                        <Image
                            source={avatarSource}
                            style={{ width: avatar * 0.9, height: avatar * 0.9 }}
                            resizeMode="contain"
                        />
                    </View>
                    <Text
                        style={{ fontSize: nameFs }}
                        className="font-bold text-gray-900"
                        numberOfLines={1}
                    >
                        {name ? `${name}님` : '사용자님'}
                    </Text>
                </View>

            </View>
        </View>
    );
}

function SectionCard({ children, className = '', ui }) {
    return (
        <View
            style={{
                maxWidth: ui.maxW,
                paddingHorizontal: ui.cardPx,
                paddingVertical: ui.cardPy,
                alignSelf: 'center',
            }}
            className={`w-full rounded-3xl bg-white border border-gray-200 shadow-sm shadow-black/10 ${className}`}
        >
            {children}
        </View>
    );
}

function ScheduleRow({ item, done, onToggle }) {
    const accent = item?.color && item.color !== 'black' ? item.color : '#10b981';

    const startM = parseDateKeepOffset(item.start);
    const endM = parseDateKeepOffset(item.end);

    const timeText =
        startM && endM
            ? `${fmtHHmmMoment(startM)} ~ ${fmtHHmmMoment(endM)}`
            : startM
                ? fmtHHmmMoment(startM)
                : endM
                    ? fmtHHmmMoment(endM)
                    : '';

    return (
        <View
            className="rounded-2xl bg-white border border-gray-200 px-5 py-4 mb-3"
            style={done ? { opacity: 0.55 } : undefined}
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                    <View className="flex-row items-center mb-2">
                        <View
                            style={{ backgroundColor: accent }}
                            className="w-2 h-2 rounded-full mr-2"
                        />
                        <Text
                            className="text-[18px] font-bold text-gray-900"
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

                    <Text
                        className="text-[22px] font-extrabold tracking-tight text-gray-900"
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

                    {!!item.place && (
                        <View className="mt-2 flex-row items-center">
                            <Ionicons name="location-outline" size={16} color="#6B7280" />
                            <Text className="ml-1 text-[13px] text-gray-700" numberOfLines={1}>
                                {item.place}
                            </Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    onPress={() => onToggle(item.id)}
                    activeOpacity={0.85}
                    className="w-8 h-8 rounded-lg border border-gray-300 items-center justify-center"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons
                        name={done ? 'checkbox' : 'square-outline'}
                        size={20}
                        color="#111827"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

function TodaySchedule({ items, loading, error, onRetry, ui }) {
    const navigation = useNavigation();
    const [doneIds, setDoneIds] = useState(new Set());
    const toggleDone = (id) => {
        setDoneIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    return (
        <SectionCard ui={ui}>
            <View className="flex-row items-center justify-between mb-3">
                <Text
                    style={{ fontSize: ui.titleSize }}
                    className="font-extrabold text-gray-900"
                >
                    오늘의 일정
                </Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('캘린더')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="calendar-outline" size={22} color="#111827" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View className="py-4 items-center">
                    <ActivityIndicator />
                </View>
            ) : error ? (
                <View className="py-3">
                    <Text className="text-red-500 mb-2">{error}</Text>
                    <TouchableOpacity
                        onPress={onRetry}
                        className="px-3 py-2 bg-gray-100 rounded-lg self-start"
                    >
                        <Text className="text-gray-800">다시 시도</Text>
                    </TouchableOpacity>
                </View>
            ) : items.length === 0 ? (
                <Text className="text-gray-500">오늘 일정이 없습니다.</Text>
            ) : (
                items.map((it) => (
                    <ScheduleRow
                        key={it.id}
                        item={it}
                        done={doneIds.has(it.id)}
                        onToggle={toggleDone}
                    />
                ))
            )}
        </SectionCard>
    );
}

function Chip({ label, onPress }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            className="px-3 py-2 rounded-2xl bg-white border border-gray-200 mr-2 mb-2"
        >
            <Text className="text-[14px] text-gray-800 font-medium">{label}</Text>
        </TouchableOpacity>
    );
}

function Assistant({ suggestions, loading, error, onRetry, ui }) {
    const navigation = useNavigation();
    const goChat = (preset) => {
        navigation.navigate('챗봇', {
            screen: 'ChatMain',
            params: { preset },
        });
    };
    return (
        <SectionCard ui={ui} className="mt-3">
            <View className="flex-row items-center">
                <View
                    style={{ width: 80, height: 80 }}
                    className="rounded-3xl bg-[#d9eadc] items-center justify-center mr-3"
                >
                    <Image
                        source={require('../../assets/logo.png')}
                        style={{ width: 64, height: 64 }}
                        resizeMode="contain"
                    />
                </View>
                <View className="flex-1">
                    <View className="relative self-start bg-gray-100 rounded-2xl px-4 py-3">
                        <View
                            style={{
                                position: 'absolute',
                                left: -8,
                                top: 14,
                                width: 0,
                                height: 0,
                                borderTopWidth: 8,
                                borderBottomWidth: 8,
                                borderRightWidth: 10,
                                borderTopColor: 'transparent',
                                borderBottomColor: 'transparent',
                                borderRightColor: '#f3f4f6',
                            }}
                        />
                        <Text className="text-[16px] text-gray-800 font-semibold">
                            무엇을 도와드릴까요?
                        </Text>
                    </View>
                </View>
            </View>

            {loading ? (
                <View className="py-3 items-center">
                    <ActivityIndicator />
                </View>
            ) : error ? (
                <View className="py-3">
                    <Text className="text-red-500 mb-2">{error}</Text>
                    <TouchableOpacity
                        onPress={onRetry}
                        className="px-3 py-2 bg-gray-100 rounded-lg self-start"
                    >
                        <Text className="text-gray-800">다시 시도</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View className="flex-row flex-wrap mt-3 -mr-2">
                    {suggestions.map((s, i) => (
                        <Chip key={`${s}-${i}`} label={s} onPress={() => goChat(s)} />
                    ))}
                </View>
            )}

            <TouchableOpacity
                onPress={() => goChat('')}
                activeOpacity={0.85}
                className="mt-3 rounded-2xl bg-gray-100 px-4 py-3 flex-row items-center justify-between"
            >
                <Text className="text-[15px] text-gray-600">실버브릿지와 대화 시작하기</Text>
                <View className="w-10 h-10 rounded-full bg-gray-300 items-center justify-center">
                    <MaterialCommunityIcons name="send" size={18} color="#4b5563" />
                </View>
            </TouchableOpacity>
        </SectionCard>
    );
}

export default function HomeScreen() {
    const ui = useResponsiveGaps();
    const [name, setName] = useState('');
    const [gender, setGender] = useState(null); // 🔹 성별 상태
    const [schedules, setSchedules] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSch, setLoadingSch] = useState(true);
    const [loadingSug, setLoadingSug] = useState(true);
    const [errSch, setErrSch] = useState('');
    const [errSug, setErrSug] = useState('');
    const [refreshing, setRefreshing] = useState(false);



    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem('USER_INFO');
                const u = raw ? JSON.parse(raw) : null;
                setName(u?.name || '');

                const g = u?.gender ?? u?.sex ?? u?.genderType ?? null;
                setGender(g);
            } catch (e) {
                console.log('[HC] USER_INFO load error:', e?.message || e);
            }
        })();
    }, []);

    const getTodayDateString = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const fetchSchedules = useCallback(async () => {
        setErrSch('');
        setLoadingSch(true);
        try {
            const dateStr = getTodayDateString();
            const list = await getSchedulesByDateApi({ date: dateStr });

            const mapped = (Array.isArray(list) ? list : []).map((item) => ({
                id: item.id,
                title: item.title,
                start: item.start_at,
                end: item.end_at,
                place: item.location || item.place || '',
                color: item.color || '#10b981',
            }));

            setSchedules(mapped);
        } catch (e) {
            setErrSch(
                e?.__normalized?.message || e?.message || '일정 로드 실패'
            );
        } finally {
            setLoadingSch(false);
        }
    }, []);

    const fetchSuggestions = useCallback(async () => {
        setErrSug('');
        setLoadingSug(true);
        try {
            const list = await getAssistantSuggestionsApi();
            setSuggestions(Array.isArray(list) ? list : []);
        } catch (e) {
            setErrSug(
                e?.__normalized?.message || e?.message || '추천 로드 실패'
            );
        } finally {
            setLoadingSug(false);
        }
    }, []);

    useEffect(() => {
        fetchSchedules();
        fetchSuggestions();
    }, [fetchSchedules, fetchSuggestions]);

    useFocusEffect(
        useCallback(() => {
            fetchSchedules();
        }, [fetchSchedules])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchSchedules(), fetchSuggestions()]);
        setRefreshing(false);
    }, [fetchSchedules, fetchSuggestions]);

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-[#f5f6f8]">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    paddingTop: ui.pageTop,
                    paddingBottom: ui.pageBottom,
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <TopBar name={name} gender={gender} ui={ui} />

                <TodaySchedule
                    items={schedules}
                    loading={loadingSch}
                    error={errSch}
                    onRetry={fetchSchedules}
                    ui={ui}
                />

                <View
                    style={{
                        maxWidth: ui.maxW,
                        marginTop: ui.cardGap,
                        marginBottom: ui.cardGap,
                        alignSelf: 'center',
                    }}
                    className="w-full px-4"
                >
                    <View className="h-2 rounded-full bg-gray-100" />
                </View>

                <Assistant
                    suggestions={suggestions}
                    loading={loadingSug}
                    error={errSug}
                    onRetry={fetchSuggestions}
                    ui={ui}
                />
            </ScrollView>
        </SafeAreaView>
    );
}
