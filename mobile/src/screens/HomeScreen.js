// mobile/src/screens/HomeScreen.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
    useWindowDimensions, RefreshControl, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayScheduleApi, getAssistantSuggestionsApi } from '../shared/api/home';

// 시간 파싱(ISO & "YYYY-MM-DD HH:mm:ss" 모두 대응)
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
function useResponsiveGaps() {
    const { width } = useWindowDimensions();
    const compact = width < 380;
    const tablet = width >= 768;
    return useMemo(() => ({
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
    }), [width, compact, tablet]);
}

function TopBar({ name, ui }) {
    const avatar = ui.tablet ? 52 : ui.compact ? 40 : 46;
    const nameFs = ui.tablet ? 19 : ui.compact ? 16 : 18;
    const iconSz = ui.tablet ? 26 : ui.compact ? 22 : 24;
    const gap = ui.tablet ? 20 : 16;
    const bottomSpace = ui.cardGap + 6;
    return (
        <View style={{ paddingHorizontal: ui.topbarPx, marginBottom: bottomSpace }} className="w-full self-center pb-1">
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                    {/* 로고 이미지 */}
                    <View style={{ width: avatar, height: avatar, borderRadius: avatar/2, backgroundColor: '#fff', alignItems:'center', justifyContent:'center', marginRight:12, borderWidth:1, borderColor:'#e5e7eb' }}>
                        <Image source={require('../../assets/logo.png')} style={{ width: avatar*0.8, height: avatar*0.8 }} resizeMode="contain" />
                    </View>
                    <Text style={{ fontSize: nameFs }} className="font-semibold text-gray-900" numberOfLines={1}>
                        {name ? `${name}님` : '사용자님'}
                    </Text>
                </View>
                <View className="flex-row items-center">
                    <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="notifications-outline" size={iconSz} color="#111827" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

function SectionCard({ children, className = '', ui }) {
    return (
        <View
            style={{ maxWidth: ui.maxW, paddingHorizontal: ui.cardPx, paddingVertical: ui.cardPy, alignSelf: 'center' }}
            className={`w-full rounded-3xl bg-white border border-gray-200 shadow-sm shadow-black/10 ${className}`}
        >
            {children}
        </View>
    );
}


function ScheduleRow({ item, done, onToggle }) {
    // 포인트 컬러 (기본 틸)
    const accent = (item?.color && item.color !== 'black') ? item.color : '#10b981';

    const startD = parseDateLoose(item.start);
    const endD   = parseDateLoose(item.end);
    const timeText = (startD && endD)
        ? `${fmtHHmm(startD)} ~ ${fmtHHmm(endD)}`
        : `${item.start || ''}${item.end ? ` ~ ${item.end}` : ''}`;

    return (
        <View
            className="rounded-2xl bg-white border border-gray-200 px-5 py-4 mb-3"
            style={done ? { opacity: 0.55 } : undefined}
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                    {/* 상단: 포인트 점 + 제목 */}
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

                    {/* 중앙: 시간 (굵게) */}
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

                    {/* 하단: 장소 (있을 때만) */}
                    {!!item.place && (
                        <View className="mt-2 flex-row items-center">
                            <Ionicons name="location-outline" size={16} color="#6B7280" />
                            <Text
                                className="ml-1 text-[13px] text-gray-700"
                                numberOfLines={1}
                            >
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
                <Text style={{ fontSize: ui.titleSize }} className="font-extrabold text-gray-900">오늘의 일정</Text>
                <TouchableOpacity onPress={() => navigation.navigate('캘린더')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="calendar-outline" size={22} color="#111827" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View className="py-4 items-center"><ActivityIndicator /></View>
            ) : error ? (
                <View className="py-3">
                    <Text className="text-red-500 mb-2">{error}</Text>
                    <TouchableOpacity onPress={onRetry} className="px-3 py-2 bg-gray-100 rounded-lg self-start">
                        <Text className="text-gray-800">다시 시도</Text>
                    </TouchableOpacity>
                </View>
            ) : items.length === 0 ? (
                <Text className="text-gray-500">오늘 일정이 없습니다.</Text>
            ) : (
                items.map((it) => (
                    <ScheduleRow key={it.id} item={it} done={doneIds.has(it.id)} onToggle={toggleDone} />
                ))
            )}
        </SectionCard>
    );
}

function Chip({ label, onPress }) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85} className="px-3 py-2 rounded-2xl bg-white border border-gray-200 mr-2 mb-2">
            <Text className="text-[14px] text-gray-800 font-medium">{label}</Text>
        </TouchableOpacity>
    );
}

function Assistant({ suggestions, loading, error, onRetry, ui }) {
    const navigation = useNavigation();
    const goChat = (preset) => {
        navigation.navigate('챗봇', { screen: 'ChatMain', params: { preset } });
    };
    return (
        <SectionCard ui={ui} className="mt-3">
            <View className="flex-row items-center">
                <View style={{ width: 80, height: 80 }} className="rounded-3xl bg-[#d9eadc] items-center justify-center mr-3">
                    <Text style={{ fontSize: 32 }}>🌱</Text>
                </View>
                <View className="flex-1">
                    <View className="relative self-start bg-gray-100 rounded-2xl px-4 py-3">
                        <View style={{
                            position: 'absolute', left: -8, top: 14, width: 0, height: 0,
                            borderTopWidth: 8, borderBottomWidth: 8, borderRightWidth: 10,
                            borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#f3f4f6',
                        }} />
                        <Text className="text-[16px] text-gray-800 font-semibold">무엇을 도와드릴까요?</Text>
                    </View>
                </View>
            </View>

            {loading ? (
                <View className="py-3 items-center"><ActivityIndicator /></View>
            ) : error ? (
                <View className="py-3">
                    <Text className="text-red-500 mb-2">{error}</Text>
                    <TouchableOpacity onPress={onRetry} className="px-3 py-2 bg-gray-100 rounded-lg self-start">
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
    const [userId, setUserId] = useState(null);
    const [schedules, setSchedules] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSch, setLoadingSch] = useState(true);
    const [loadingSug, setLoadingSug] = useState(true);
    const [errSch, setErrSch] = useState('');
    const [errSug, setErrSug] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // USER_INFO에서 이름/ID
    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem('USER_INFO');
                const u = raw ? JSON.parse(raw) : null;
                setName(u?.name || '');
                const id = u?.id ?? u?.userId ?? u?.uid ?? u?.sub ?? null;
                setUserId(id);
                console.log('[HC] USER_INFO =', u, '=> userId =', id);
            } catch {}
        })();
    }, []);

    const fetchSchedules = useCallback(async () => {
        setErrSch('');
        setLoadingSch(true);
        try {
            if (!userId) { setSchedules([]); return; }
            const items = await getTodayScheduleApi(userId);
            setSchedules(items);
            if (items.length === 0) {
                console.log('[HC] TODAY SCHEDULE EMPTY — 서버엔 정상/데이터 없음 가능');
            }
        } catch (e) {
            setErrSch(e?.__normalized?.message || e?.message || '일정 로드 실패');
        } finally {
            setLoadingSch(false);
        }
    }, [userId]);

    const fetchSuggestions = useCallback(async () => {
        setErrSug('');
        setLoadingSug(true);
        try {
            const list = await getAssistantSuggestionsApi();
            setSuggestions(list);
        } catch (e) {
            setErrSug(e?.__normalized?.message || e?.message || '추천 로드 실패');
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
                contentContainerStyle={{ paddingTop: ui.pageTop, paddingBottom: ui.pageBottom }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <TopBar name={name} ui={ui} />
                <TodaySchedule items={schedules} loading={loadingSch} error={errSch} onRetry={fetchSchedules} ui={ui} />

                <View
                    style={{ maxWidth: ui.maxW, marginTop: ui.cardGap, marginBottom: ui.cardGap, alignSelf: 'center' }}
                    className="w-full px-4"
                >
                    <View className="h-2 rounded-full bg-gray-100" />
                </View>

                <Assistant suggestions={suggestions} loading={loadingSug} error={errSug} onRetry={fetchSuggestions} ui={ui} />
            </ScrollView>
        </SafeAreaView>
    );
}
