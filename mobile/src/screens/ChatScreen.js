import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, FlatList, Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import store from '../shared/chat/storeFactory';
import { now } from '../shared/chat/types';

const SUGGESTIONS = ['날씨정보', '일정확인 및 등록', '복지'];

function mockBotReply(text) {
    const t = (text || '').toLowerCase();
    if (t.includes('날씨')) return '오늘 서울은 비 소식이 있어요. 우산 챙기면 좋아요 ☔️';
    if (t.includes('일정')) return '새 일정을 등록할까요? 예: “내일 2시 병원 예약”';
    if (t.includes('복지')) return '가까운 복지관과 신청 가능한 서비스 목록을 알려드릴게요.';
    return '요청하신 내용을 정리하고 있어요. 잠시만 기다려 주세요!';
}

function TopRow({ onPressHistory }) {
    return (
        <View className="px-4 pt-1 pb-2">
            <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-black/80 mr-2" />
                <TouchableOpacity className="flex-row items-center" onPress={onPressHistory}>
                    <Text className="text-[13px] text-gray-800 mr-1">내 스토리</Text>
                    <Ionicons name="chevron-down" size={14} color="#374151" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function ChatScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const threadId = route.params?.threadId || 'main';
    const title = route.params?.title || '내 스토리';

    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]); // inverted
    const [isTyping, setIsTyping] = useState(false);
    const [sending, setSending] = useState(false); // 전송중 락
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const lastPressRef = useRef(0); // 빠른 연타 방지

    // 초기 로드
    useEffect(() => {
        (async () => {
            try {
                console.log('[init] ensureThread start');
                await store.local.ensureThread(threadId, title);

                console.log('[init] loadMessages local');
                const local = await store.local.loadMessages(threadId);
                setMessages((local || []).slice().reverse());

                if (store.sync) {
                    console.log('[init] sync start');
                    try {
                        await store.sync();
                    } catch (e) {
                        // 서버 미연동/모크 단계에서의 경고는 메시지만 출력
                        console.warn('[init] sync error:', e?.message ?? String(e));
                    }
                    console.log('[init] sync done → reload local');
                    const after = await store.local.loadMessages(threadId);
                    setMessages((after || []).slice().reverse());
                }
                console.log('[init] done');
            } catch (e) {
                // ❗️스택 출력 금지 (Metro가 InternalBytecode.js를 열려다 ENOENT)
                console.warn('chat init error:', e?.message ?? String(e));
            }
        })();
    }, [threadId, title]);

    // preset 자동 입력
    useEffect(() => {
        const preset = route.params?.preset;
        if (typeof preset === 'string') {
            setInput(preset);
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [route.params?.preset]);

    const scrollToEnd = useCallback(() => {
        requestAnimationFrame(() =>
            listRef.current?.scrollToOffset({ offset: 0, animated: true })
        );
    }, []);

    // 전송 가능 여부 (빈문자/전송중 차단)
    const canSend = useMemo(() => {
        return !sending && input.trim().length > 0;
    }, [sending, input]);

    // 낙관적 전송 → 서버 확정 치환
    const send = useCallback(
        async (textArg) => {
            const nowMs = Date.now();
            if (nowMs - lastPressRef.current < 350) return; // 더블탭 방지
            lastPressRef.current = nowMs;

            const contentRaw = typeof textArg === 'string' ? textArg : input;
            const content = (contentRaw || '').trim();
            if (!content) return; // 빈 입력 차단
            if (sending) return; // 전송 중 락

            setSending(true);
            Keyboard.dismiss();

            const tempId = `tmp-${now()}`;
            const temp = {
                tempId,
                threadId,
                role: 'me',
                text: content,
                createdAt: now(),
                status: 'sending',
            };

            try {
                // 1) UI 즉시 추가
                setMessages((prev) => [temp, ...(prev || [])]);
                setInput('');

                // 2) 로컬 저장 (실패해도 UI 진행)
                store.local.appendMessage(threadId, temp).catch((e) =>
                    console.warn('local append failed:', e?.message ?? String(e))
                );

                // 3) 서버/목 전송
                let fixed = null;
                try {
                    const confirmed = await store.sendMessage(threadId, content);
                    // confirmed가 undefined/null이면 안전치환
                    fixed = {
                        id: confirmed?.id ?? `m-${now()}`,
                        threadId,
                        role: confirmed?.role ?? 'me',
                        text: confirmed?.text ?? content,
                        createdAt: confirmed?.createdAt ?? now(),
                        status: 'sent',
                    };
                } catch (e) {
                    console.warn('[send] server fail → mark error:', e?.message ?? String(e));
                    setMessages((prev) =>
                        (prev || []).map((m) => (m.tempId === tempId ? { ...m, status: 'error' } : m))
                    );
                    store.local.markError(threadId, tempId).catch(() => {});
                    return;
                }

                // 4) 치환
                setMessages((prev) =>
                    (prev || []).map((m) => (m.tempId === tempId ? fixed : m))
                );
                store.local.replaceTemp(threadId, tempId, fixed).catch(() => {});

                // 5) 봇 응답(목)
                setIsTyping(true);
                setTimeout(() => {
                    const bot = {
                        id: `b-${now()}`,
                        threadId,
                        role: 'bot',
                        text: mockBotReply(content),
                        createdAt: now(),
                        status: 'sent',
                    };
                    setMessages((prev) => [bot, ...(prev || [])]);
                    setIsTyping(false);
                    store.local.appendMessage(threadId, bot).catch(() => {});
                    scrollToEnd();
                }, 600);
            } catch (e) {
                console.warn('[send] fatal error:', e?.message ?? String(e));
            } finally {
                setSending(false); // 실패/성공 모두 풀어주기
            }
        },
        [input, sending, threadId, scrollToEnd]
    );

    const renderItem = ({ item }) => {
        const isMe = item.role === 'me';
        const bubbleCls = isMe
            ? 'bg-teal-600 rounded-2xl rounded-tr-none'
            : 'bg-gray-200 rounded-2xl rounded-tl-none';
        const showError = item.status === 'error';
        return (
            <View className={`w-full mb-2 ${isMe ? 'items-end' : 'items-start'}`}>
                <View
                    style={{ maxWidth: '80%' }}
                    className={`px-4 py-3 ${bubbleCls} ${showError ? 'opacity-60' : ''}`}
                >
                    <Text className={`${isMe ? 'text-white' : 'text-gray-800'} leading-5`}>
                        {item.text}
                    </Text>
                    {showError && (
                        <TouchableOpacity onPress={() => send(item.text)} className="mt-2 self-end">
                            <Text className="text-[11px] text-white/90 underline">다시 보내기</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-[#f7f8f7]">
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <TopRow onPressHistory={() => navigation.navigate('대화기록')} />

                <View className="flex-1">
                    {messages.length === 0 ? (
                        <View className="flex-1 items-center justify-center px-6">
                            <Text className="text-[16px] font-semibold text-gray-800 text-center">
                                초록나무님, 무엇을 도와드릴까요
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            ref={listRef}
                            data={messages}
                            keyExtractor={(it) => it.id || it.tempId}
                            renderItem={renderItem}
                            inverted
                            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                            ListFooterComponent={
                                isTyping ? (
                                    <View className="py-2">
                                        <View className="self-start bg-gray-200 rounded-2xl px-4 py-2">
                                            <View className="flex-row space-x-1">
                                                <View className="w-1.5 h-1.5 rounded-full bg-gray-500 opacity-70" />
                                                <View className="w-1.5 h-1.5 rounded-full bg-gray-500 opacity-70" />
                                                <View className="w-1.5 h-1.5 rounded-full bg-gray-500 opacity-70" />
                                            </View>
                                        </View>
                                    </View>
                                ) : null
                            }
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>

                {/* 추천 칩 */}
                <View className="px-4 pb-2">
                    <View className="flex-row flex-wrap -mr-2">
                        {SUGGESTIONS.map((s) => (
                            <TouchableOpacity
                                key={s}
                                onPress={() => {
                                    setInput(s);
                                    // 프레임 하나 넘겨서 state 반영 후 전송 (UI 일관성)
                                    requestAnimationFrame(() => send(s));
                                }}
                                className="mr-2 mb-2 px-3 py-2 rounded-2xl bg-[#eaf2e6]"
                                activeOpacity={0.85}
                            >
                                <Text className="text-[12.5px] text-gray-800">{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 입력 바 */}
                <View className="px-4 pb-3">
                    <View className="flex-row items-center bg-gray-100 rounded-2xl px-2 py-2">
                        <TouchableOpacity
                            className="w-10 h-10 mr-1 items-center justify-center"
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <MaterialCommunityIcons name="sticker-emoji" size={20} color="#6b7280" />
                        </TouchableOpacity>

                        <TextInput
                            ref={inputRef}
                            className="flex-1 px-2 py-2 text-[15px]"
                            placeholder="메시지를 입력하세요"
                            placeholderTextColor="#9CA3AF"
                            value={input}
                            onChangeText={setInput}
                            returnKeyType="send"
                            onSubmitEditing={() => canSend && send()}
                            blurOnSubmit={Platform.OS === 'ios'}
                        />

                        <TouchableOpacity
                            onPress={() => send()}
                            className={`w-10 h-10 rounded-full items-center justify-center ${
                                canSend ? 'bg-teal-600' : 'bg-gray-300'
                            }`}
                            activeOpacity={0.85}
                            disabled={!canSend}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="send" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
