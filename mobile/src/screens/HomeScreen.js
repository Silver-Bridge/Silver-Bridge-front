import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayScheduleApi, getAssistantSuggestionsApi } from '../shared/api/home';

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
                    <View style={{ width: avatar, height: avatar }} className="rounded-full bg-black/80 mr-3" />
                    <Text style={{ fontSize: nameFs }} className="font-semibold text-gray-900" numberOfLines={1}>
                        {name ? `${name}님` : '사용자님'}
                    </Text>
                </View>
                <View className="flex-row items-center">
                    <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="notifications-outline" size={iconSz} color="#111827" />
                    </TouchableOpacity>
                    <View style={{ width: gap }} />
                    <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="search" size={iconSz} color="#111827" />
                    </TouchableOpacity>
                    <View style={{ width: gap }} />
                    <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="settings-outline" size={iconSz} color="#111827" />
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
    const pillBg = item.color === 'black' ? 'bg-black' : 'bg-[#ff7a76]';

    return (
        <View
            className={`rounded-2xl ${pillBg} px-5 py-4 mb-3 flex-row items-center justify-between`}
            // ✅ 완료 시 카드 전체를 살짝 흐리게
            style={done ? { opacity: 0.55 } : undefined}
        >
            <View className="flex-1 pr-3">
                {/* ✅ 타이틀/시간에 취소선 추가 */}
                <Text
                    className="text-white/90 text-[13px] font-semibold mb-1"
                    style={done ? { textDecorationLine: 'line-through', textDecorationColor: 'rgba(255,255,255,0.85)' } : undefined}
                >
                    {item.title}
                </Text>
                <Text
                    className="text-white text-[22px] font-extrabold tracking-tight"
                    style={done ? { textDecorationLine: 'line-through', textDecorationColor: 'rgba(255,255,255,0.9)' } : undefined}
                >
                    {item.start} ~ {item.end}
                </Text>
            </View>

            <TouchableOpacity
                onPress={() => onToggle(item.id)}
                activeOpacity={0.85}
                className="w-8 h-8 rounded-lg bg-white/15 items-center justify-center"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Ionicons name={done ? 'checkbox' : 'square-outline'} size={22} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

function TodaySchedule({ items, loading, ui }) {
    const navigation = useNavigation();
    const [doneIds, setDoneIds] = useState(new Set());

    const toggleDone = (id) => {
        setDoneIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    return (
        <SectionCard ui={ui}>
            {/* 제목 + 달력 아이콘 → 캘린더 탭 이동 */}
            <View className="flex-row items-center justify-between mb-3">
                <Text style={{ fontSize: ui.titleSize }} className="font-extrabold text-gray-900">
                    오늘의 일정
                </Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('캘린더')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="flex-row items-center"
                >
                    <Ionicons name="calendar-outline" size={22} color="#111827" />

                </TouchableOpacity>
            </View>

            {loading ? (
                <View className="py-4 items-center">
                    <ActivityIndicator />
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

function Assistant({ suggestions, loading, ui }) {
    const navigation = useNavigation();
    const goChat = (preset) => {
        // 탭의 챗봇으로 이동 + 프리셋 텍스트 전달
        navigation.navigate('챗봇', { preset });
    };

    return (
        <SectionCard ui={ui} className="mt-3">
            <View className="flex-row items-center">
                {/* 로고/마스코트(이미지로 교체되어 있다면 동일 컨테이너 사용) */}
                <View style={{ width: 80, height: 80 }} className="rounded-3xl bg-[#d9eadc] items-center justify-center mr-3">
                    <Text style={{ fontSize: 32 }}>🌱</Text>
                </View>

                {/* 말풍선 + 꼬리 */}
                <View className="flex-1">
                    <View className="relative self-start bg-gray-100 rounded-2xl px-4 py-3">
                        <View
                            style={{
                                position: 'absolute', left: -8, top: 14, width: 0, height: 0,
                                borderTopWidth: 8, borderBottomWidth: 8, borderRightWidth: 10,
                                borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#f3f4f6',
                            }}
                        />
                        <Text className="text-[16px] text-gray-800 font-semibold">무엇을 도와드릴까요?</Text>
                    </View>
                </View>
            </View>

            {/* 칩 */}
            {loading ? (
                <View className="py-3 items-center"><ActivityIndicator /></View>
            ) : (
                <View className="flex-row flex-wrap mt-3 -mr-2">
                    {suggestions.map((s, i) => (
                        <Chip key={`${s}-${i}`} label={s} onPress={() => goChat(s)} />
                    ))}
                </View>
            )}

            {/* 입력바 클릭 → 챗봇 탭 */}
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
    const [schedules, setSchedules] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSch, setLoadingSch] = useState(true);
    const [loadingSug, setLoadingSug] = useState(true);

    useEffect(() => {
        (async () => {
            const raw = await AsyncStorage.getItem('USER_INFO');
            if (raw) setName(JSON.parse(raw).name || '');
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                setLoadingSch(true);
                const items = await getTodayScheduleApi();
                setSchedules(items);
            } finally {
                setLoadingSch(false);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                setLoadingSug(true);
                const list = await getAssistantSuggestionsApi();
                setSuggestions(list);
            } finally {
                setLoadingSug(false);
            }
        })();
    }, []);

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-[#f5f6f8]">
            <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: ui.pageTop, paddingBottom: ui.pageBottom }} showsVerticalScrollIndicator={false}>
                <TopBar name={name} ui={ui} />
                <TodaySchedule items={schedules} loading={loadingSch} ui={ui} />

                <View style={{ maxWidth: ui.maxW, marginTop: ui.cardGap, marginBottom: ui.cardGap, alignSelf: 'center' }} className="w-full px-4">
                    <View className="h-2 rounded-full bg-gray-100" />
                </View>

                <Assistant suggestions={suggestions} loading={loadingSug} ui={ui} />
            </ScrollView>
        </SafeAreaView>
    );
}
