// /src/screens/ChatScreen.js
import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
    useLayoutEffect,
    useMemo,
} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    FlatList,
    Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { sendText, getHistory } from '../shared/api/chatbot';
import { useChatFontSize } from '../shared/utils/useChatFont'; // 🔹 추가

const SUGGESTIONS = ['날씨정보', '일정확인 및 등록', '복지'];

export default function ChatScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    // 🔹 회원이 설정한 글자 크기 가져오기 (기본 16)
    const { chatFontSize } = useChatFontSize(16);

    // history 화면에서 들어오면 sessionId가 넘어오고, 새 대화면 undefined
    const initialSessionId =
        route.params?.sessionId ?? route.params?.serverSessionId ?? null;
    const title = route.params?.title || '내 대화방';
    const regionCode = route.params?.regionCode || 'std';

    const [sessionId, setSessionId] = useState(initialSessionId);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]); // FlatList + inverted라 최신 메시지가 배열 앞에 오게 관리
    const [sending, setSending] = useState(false);
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);

    const inputRef = useRef(null);
    const listRef = useRef(null);
    const lastPressRef = useRef(0);
    const speakBot = useCallback((text) => {
        if (!text) return;
        try {
            // 이전 말 읽는 중이면 정지
            Speech.stop();
            Speech.speak(String(text), {
                language: 'ko-KR', // 한국어
                pitch: 1.0,
                rate: 0.9,        // 살짝 느리게 (어르신용)
            });
        } catch (e) {
            console.warn('Speech error:', e);
        }
    }, []);
    // 헤더에 "대화기록" 버튼
    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: title,
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => navigation.navigate('대화기록')}
                    style={{ paddingHorizontal: 12, paddingVertical: 6 }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Text
                        style={{
                            fontSize: 14,
                            color: '#0f766e',
                            fontWeight: '700',
                        }}
                    >
                        대화기록
                    </Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, title]);

    // 기존 세션 진입 시 히스토리 로드
    useEffect(() => {
        if (!initialSessionId) return;
        (async () => {
            try {
                const history = await getHistory(initialSessionId); // [{role, content}]
                const mapped = mapHistoryToMessages(history, initialSessionId);
                setMessages(mapped);
            } catch (e) {
                console.warn('history load error:', e?.message ?? String(e));
            }
        })();
    }, [initialSessionId]);

    useFocusEffect(
        useCallback(() => {
            if (!sessionId) return;

            let cancelled = false;

            (async () => {
                try {
                    const history = await getHistory(sessionId);
                    if (!cancelled) {
                        const mapped = mapHistoryToMessages(history, sessionId);
                        setMessages(mapped);
                    }
                } catch (e) {
                    console.warn('history reload on focus error:', e?.message ?? String(e));
                }
            })();

            return () => {
                cancelled = true;
            };
        }, [sessionId])
    );

    // 홈 추천칩에서 preset 넘어오면 자동 입력
    useEffect(() => {
        const preset = route.params?.preset;
        if (typeof preset === 'string') {
            setInput(preset);
            setTimeout(() => inputRef.current?.focus?.(), 0);
        }
    }, [route.params?.preset]);

    const scrollToEnd = useCallback(() => {
        requestAnimationFrame(() =>
            listRef.current?.scrollToOffset({ offset: 0, animated: true }),
        );
    }, []);

    const canSend = useMemo(
        () => !sending && input.trim().length > 0,
        [sending, input],
    );

    // 서버 history 응답 → 화면용 메시지 배열로 변환 (inverted에 맞게 최신이 앞쪽)
    const mapHistoryToMessages = (history, sid) => {
        if (!Array.isArray(history)) return [];
        const mapped = history.map((m, idx) => {
            const lRole = (m.role || '').toLowerCase(); // "user"|"assistant"|"system"
            const role = lRole === 'user' ? 'me' : 'bot';
            return {
                id: `${sid ?? 'ns'}-${idx}`,
                role,
                text: m.content,
                status: 'sent',
            };
        });
        // history는 오래된→최신 순일 가능성이 크므로 뒤집어서 최신이 배열 첫번째
        return mapped.reverse();
    };

    useEffect(() => {
        const fromRoute = route.params?.sessionId ?? null;
        if (!fromRoute) return;
        if (fromRoute === sessionId) return; // 이미 같은 세션이면 무시

        setSessionId(fromRoute);

        (async () => {
            try {
                const history = await getHistory(fromRoute);
                const mapped = mapHistoryToMessages(history, fromRoute);
                setMessages(mapped);
            } catch (e) {
                console.warn('history reload from route error:', e?.message ?? String(e));
            }
        })();
    }, [route.params?.sessionId]);

    const onSend = useCallback(
        async (textArg) => {
            const nowMs = Date.now();
            if (nowMs - lastPressRef.current < 350) return;
            lastPressRef.current = nowMs;

            const raw = typeof textArg === 'string' ? textArg : input;
            const content = (raw || '').trim();
            if (!content || sending) return;

            setSending(true);
            Keyboard.dismiss();

            // 1) 내 메시지 먼저 화면에 반영 (임시)
            const tempId = `tmp-${nowMs}`;
            const tempMessage = {
                id: tempId,
                role: 'me',
                text: content,
                status: 'sending',
            };
            setMessages((prev) => [tempMessage, ...(prev || [])]);
            setInput('');
            scrollToEnd();

            try {
                // 2) 서버 전송
                const res = await sendText({
                    text: content,
                    sessionId,
                    regionCode,
                });
                // res: { sessionId, replyText, history: [...] }

                const newSessionId = res.sessionId;
                if (!sessionId && newSessionId) {
                    setSessionId(newSessionId);
                }

                // 3) 서버 기준 history로 전체 대화 덮어쓰기
                if (Array.isArray(res.history)) {
                    const mapped = mapHistoryToMessages(res.history, newSessionId);
                    setMessages(mapped);
                    scrollToEnd();
                } else {
                    // history가 없을 일은 거의 없겠지만, 최소한 내 메시지/봇응답만 다시 세팅
                    const myMsg = {
                        id: `u-${nowMs}`,
                        role: 'me',
                        text: content,
                        status: 'sent',
                    };
                    const botMsg = res.replyText
                        ? {
                            id: `b-${nowMs}`,
                            role: 'bot',
                            text: res.replyText,
                            status: 'sent',
                        }
                        : null;
                    const arr = botMsg ? [botMsg, myMsg] : [myMsg];
                    setMessages(arr);
                    scrollToEnd();
                }
            } catch (e) {
                console.warn('[send] server fail:', e?.message ?? String(e));
                // 실패 시, 해당 메시지에 error 표시
                setMessages((prev) =>
                    (prev || []).map((m) =>
                        m.id === tempId ? { ...m, status: 'error' } : m,
                    ),
                );
            } finally {
                setSending(false);
            }
        },
        [input, sending, sessionId, regionCode, scrollToEnd],
    );

    const renderItem = ({ item }) => {
        const isMe = item.role === 'me';
        const bubbleCls = isMe
            ? 'bg-teal-600 rounded-2xl rounded-tr-none'
            : 'bg-gray-200 rounded-2xl rounded-tl-none';
        const showError = item.status === 'error';

        return (
            <View
                className={`w-full mb-2 ${isMe ? 'items-end' : 'items-start'}`}
            >
                <View
                    style={{ maxWidth: '80%' }}
                    className={`px-4 py-3 ${bubbleCls} ${
                        showError ? 'opacity-60' : ''
                    }`}
                >
                    <Text
                        className={`${
                            isMe ? 'text-white' : 'text-gray-800'
                        } leading-5`}
                        // 🔹 말풍선 텍스트: 설정된 폰트 사이즈 사용
                        style={{ fontSize: chatFontSize, lineHeight: chatFontSize + 4 }}
                    >
                        {item.text}
                    </Text>
                    {showError && (
                        <TouchableOpacity
                            onPress={() => onSend(item.text)}
                            className="mt-2 self-end"
                        >
                            <Text
                                className="text-[11px] text-white/90 underline"
                                style={{ fontSize: 11 }} // 🔹 안내는 고정 소형
                            >
                                다시 보내기
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        // ✅ bottom safe-area는 직접 처리할 거라 top만 적용
        <SafeAreaView
            edges={[]}
            className="flex-1 bg-[#f7f8f7]"
        >
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={
                    Platform.OS === 'ios'
                        ? (insets.top || 0) + 20 // 너무 올라가면 50~70 사이에서 조절
                        : 0
                }
            >
                <View className="flex-1" style={{ paddingTop: 16 }}>
                    {messages.length === 0 ? (
                        <View className="flex-1 items-center justify-center px-6">
                            <Text
                                className="text-[16px] font-semibold text-gray-800 text-center"
                                // 🔹 빈 상태 안내 문구에도 동일 폰트 적용
                                style={{ fontSize: chatFontSize }}
                            >
                                무엇을 도와드릴까요
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            ref={listRef}
                            data={messages}
                            keyExtractor={(it) => it.id}
                            renderItem={renderItem}
                            inverted
                            contentContainerStyle={{
                                paddingHorizontal: 16,


                            }}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode={
                                Platform.OS === 'ios' ? 'interactive' : 'on-drag'
                            }
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>

                {/* 추천 칩 */}
                <View className="px-4 pb-1">
                    <View className="flex-row flex-wrap -mr-2">
                        {SUGGESTIONS.map((s) => (
                            <TouchableOpacity
                                key={s}
                                onPress={() => {
                                    setInput(s);
                                    requestAnimationFrame(() => onSend(s));
                                }}
                                className="mr-2 mb-2 px-3 py-2 rounded-2xl bg-[#eaf2e6]"
                                activeOpacity={0.85}
                            >
                                <Text
                                    className="text-[12.5px] text-gray-800"
                                    // 🔹 칩 텍스트는 살짝 작게 (기본보다 -2)
                                    style={{ fontSize: Math.max(chatFontSize - 2, 12) }}
                                >
                                    {s}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ✅ 입력 바 */}
                <View
                    style={{
                        paddingBottom: Math.max(insets.bottom - 10, 6), // 탭바와의 간격 6~10px 정도
                    }}
                    className="px-4"
                >
                    <View className="flex-row items-center bg-gray-100 rounded-2xl px-2 py-2">
                        {/* 🎤 마이크 버튼 */}
                        <TouchableOpacity
                            className="w-10 h-10 mr-1 items-center justify-center"
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            onPress={() => {
                                navigation.navigate('VoiceChat', {
                                    sessionId,       // 현재 텍스트 세션 아이디 (없으면 undefined → 새 세션)
                                    regionCode,
                                });
                            }}
                        >
                            <MaterialCommunityIcons
                                name="microphone"
                                size={20}
                                color="#6b7280"
                            />
                        </TouchableOpacity>

                        <TextInput
                            ref={inputRef}
                            className="flex-1 px-2 py-2 text-[15px]"
                            placeholder="메시지를 입력하세요"
                            placeholderTextColor="#9CA3AF"
                            value={input}
                            onChangeText={setInput}
                            returnKeyType="send"
                            onSubmitEditing={() => canSend && onSend()}
                            blurOnSubmit={Platform.OS === 'ios'}
                            // 🔹 입력창 텍스트도 동일 폰트
                            style={{ fontSize: chatFontSize }}
                        />

                        <TouchableOpacity
                            onPress={() => onSend()}
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
