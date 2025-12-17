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
    Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
    useRoute,
    useNavigation,
    useFocusEffect,
} from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

import { sendText, getHistory } from '../shared/api/chatbot';
import { useChatFontSize } from '../shared/utils/useChatFont';

const SUGGESTIONS = ['날씨정보', '일정확인 및 등록', '복지'];


function regionLabelToCode(regionLabel) {
    if (!regionLabel) return 'std';

    const t = regionLabel.trim();

    if (t === '경상도') {
        return 'gs';
    }

    if (t === '강원도') {
        return 'gw';
    }
    return 'std';
}
function expandSuggestion(label, regionLabel) {
    const regionPart = regionLabel ? `${regionLabel} ` : '';

    switch (label) {
        case '날씨정보':
            return `${regionPart}오늘 날씨 알려줘`;
        case '일정확인 및 등록':
            return '오늘 일정 확인하고 새 일정도 등록해줘';
        case '복지':
            return regionLabel
                ? `${regionLabel}에서 받을 수 있는 복지 혜택 알려줘`
                : '받을 수 있는 복지 혜택 알려줘';
        default:
            return label;
    }
}

function ChatHeader({ name, chatFontSize, onChipPress }) {
    const displayName = name ? `${name}님` : '고객님';

    return (
        <View className="w-full items-center px-6 pt-12 pb-6 bg-transparent">
            {/* 로고 / 마스코트 */}
            <View
                style={{ width: 72, height: 72 }}
                className="rounded-full bg-[#e2f1dd] items-center justify-center mb-4"
            >
                <Image
                    source={require('../../assets/logo.png')}
                    style={{ width: 56, height: 56 }}
                    resizeMode="contain"
                />
            </View>

            <Text
                className="font-semibold text-gray-900 text-center"
                style={{ fontSize: chatFontSize + 2 }}
            >
                안녕하세요, {displayName}
            </Text>
            <Text
                className="mt-1 text-gray-500 text-center"
                style={{ fontSize: chatFontSize - 1 }}
            >
                궁금한 내용을 편하게 말씀해 주세요.
            </Text>

            <View className="mt-4 flex-row flex-wrap justify-center -mr-2">
                {SUGGESTIONS.map((s) => (
                    <TouchableOpacity
                        key={s}
                        onPress={() => onChipPress(s)}
                        className="mr-2 mb-2 px-3 py-2 rounded-2xl bg-[#eaf2e6]"
                        activeOpacity={0.85}
                    >
                        <Text
                            className="text-gray-800"
                            style={{ fontSize: Math.max(chatFontSize - 2, 12) }}
                        >
                            {s}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

export default function ChatScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight(); // 🔹 헤더 높이

    const { chatFontSize } = useChatFontSize(16);

    const initialSessionId =
        route.params?.sessionId ?? route.params?.serverSessionId ?? null;

    const routeRegionCode = route.params?.regionCode || 'std';

    const [sessionId, setSessionId] = useState(initialSessionId);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [sending, setSending] = useState(false);
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [name, setName] = useState('');

    const [userRegionLabel, setUserRegionLabel] = useState('');

    const inputRef = useRef(null);
    const listRef = useRef(null);
    const lastPressRef = useRef(0);

    const speakBot = useCallback((text) => {
        if (!text) return;
        try {
            Speech.stop();
            Speech.speak(String(text), {
                language: 'ko-KR',
                pitch: 1.0,
                rate: 0.9,
            });
        } catch (e) {
            console.warn('Speech error:', e);
        }
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem('USER_INFO');
                const u = raw ? JSON.parse(raw) : null;

                setName(u?.name || '');
                setUserRegionLabel(u?.region || '');
            } catch (e) {
                console.warn('USER_INFO load error:', e?.message ?? String(e));
            }
        })();
    }, []);

    const effectiveRegionCode = useMemo(() => {
        const fromUser = regionLabelToCode(userRegionLabel);
        return fromUser || routeRegionCode || 'std';
    }, [userRegionLabel, routeRegionCode]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: '담소방',
            headerLeft: () => (
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ paddingHorizontal: 12, paddingVertical: 6 }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons
                        name="chevron-back"
                        size={22}
                        color="#111827"
                    />
                </TouchableOpacity>
            ),
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
    }, [navigation]);

    const mapHistoryToMessages = useCallback((history, sid) => {
        if (!Array.isArray(history)) return [];
        return history.map((m, idx) => {
            const lRole = (m.role || '').toLowerCase();
            const role = lRole === 'user' ? 'me' : 'bot';
            return {
                id: `${sid ?? 'ns'}-${idx}`,
                role,
                text: m.content,
                status: 'sent',
            };
        });
    }, []);

    useEffect(() => {
        if (!initialSessionId) return;
        (async () => {
            try {
                const history = await getHistory(initialSessionId);
                const mapped = mapHistoryToMessages(history, initialSessionId);
                setMessages(mapped);
            } catch (e) {
                console.warn('history load error:', e?.message ?? String(e));
            }
        })();
    }, [initialSessionId, mapHistoryToMessages]);

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
                    console.warn(
                        'history reload on focus error:',
                        e?.message ?? String(e),
                    );
                }
            })();

            return () => {
                cancelled = true;
            };
        }, [sessionId, mapHistoryToMessages]),
    );

    useEffect(() => {
        const preset = route.params?.preset;
        if (typeof preset === 'string') {
            setInput(preset);
            setTimeout(() => inputRef.current?.focus?.(), 0);
        }
    }, [route.params?.preset]);

    const scrollToEnd = useCallback(() => {
        requestAnimationFrame(() => {
            listRef.current?.scrollToEnd({ animated: true });
        });
    }, []);

    const canSend = useMemo(
        () => !sending && input.trim().length > 0,
        [sending, input],
    );

    useEffect(() => {
        const fromRoute = route.params?.sessionId ?? null;
        if (!fromRoute) return;
        if (fromRoute === sessionId) return;

        setSessionId(fromRoute);

        (async () => {
            try {
                const history = await getHistory(fromRoute);
                const mapped = mapHistoryToMessages(history, fromRoute);
                setMessages(mapped);
            } catch (e) {
                console.warn(
                    'history reload from route error:',
                    e?.message ?? String(e),
                );
            }
        })();
    }, [route.params?.sessionId, sessionId, mapHistoryToMessages]);

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

            const tempId = `tmp-${nowMs}`;
            const tempMessage = {
                id: tempId,
                role: 'me',
                text: content,
                status: 'sending',
            };
            setMessages((prev) => [...(prev || []), tempMessage]);
            setInput('');
            scrollToEnd();

            try {

                console.log('[CHAT REQ]', {
                    text: content,
                    sessionId,
                    regionCode: effectiveRegionCode,
                });

                const res = await sendText({
                    text: content,
                    sessionId,
                    regionCode: effectiveRegionCode,
                });

                console.log('[CHAT RES]', res);
                if (res.replyText) {
                    console.log('[CHAT REPLY TEXT]', res.replyText);
                }
                if (Array.isArray(res.history)) {
                    console.log('[CHAT HISTORY LEN]', res.history.length);
                }

                const newSessionId = res.sessionId;
                if (!sessionId && newSessionId) {
                    setSessionId(newSessionId);
                }

                if (Array.isArray(res.history)) {
                    const mapped = mapHistoryToMessages(res.history, newSessionId);
                    setMessages(mapped);
                    scrollToEnd();
                } else {
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
                    const arr = botMsg ? [myMsg, botMsg] : [myMsg];
                    setMessages(arr);
                    scrollToEnd();
                }

                if (res.replyText) {
                    speakBot(res.replyText);
                }
            } catch (e) {
                console.warn('[send] server fail:', e?.message ?? String(e));
                setMessages((prev) =>
                    (prev || []).map((m) =>
                        m.id === tempId ? { ...m, status: 'error' } : m,
                    ),
                );
            } finally {
                setSending(false);
            }
        },
        [input, sending, sessionId, effectiveRegionCode, scrollToEnd, speakBot],
    );

    const renderItem = ({ item }) => {
        const isMe = item.role === 'me';
        const showError = item.status === 'error';

        const bubbleBase = 'px-4 py-3 rounded-2xl shadow-sm';
        const bubbleStyle = isMe
            ? { backgroundColor: '#00a887' }
            : {
                backgroundColor: '#ffffff',
                borderWidth: 1,
                borderColor: '#e5e7eb',
            };

        const textColor = isMe ? '#ffffff' : '#111827';

        return (
            <View className="w-full mb-3">
                <View
                    className={`flex-row ${
                        isMe ? 'justify-end' : 'justify-start'
                    } items-end`}
                >
                    {!isMe && (
                        <View className="mr-2">
                            <Image
                                source={require('../../assets/logo.png')}
                                style={{ width: 26, height: 26, borderRadius: 13 }}
                                resizeMode="contain"
                            />
                        </View>
                    )}

                    <View
                        style={[
                            { maxWidth: '75%' },
                            bubbleStyle,
                            showError && { opacity: 0.6 },
                        ]}
                        className={bubbleBase}
                    >
                        <Text
                            style={{
                                color: textColor,
                                fontSize: chatFontSize,
                                lineHeight: chatFontSize + 4,
                            }}
                        >
                            {item.text}
                        </Text>

                        {showError && (
                            <TouchableOpacity
                                onPress={() => onSend(item.text)}
                                className="mt-2 self-end"
                            >
                                <Text
                                    style={{
                                        fontSize: 11,
                                        color: isMe ? '#e5e7eb' : '#6b7280',
                                        textDecorationLine: 'underline',
                                    }}
                                >
                                    다시 보내기
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    const renderFooter = () => {
        if (!sending) return null;

        return (
            <View className="w-full mt-2 mb-2 items-start">
                <View className="flex-row items-center px-2">
                    <Image
                        source={require('../../assets/silvy_loading.gif')}
                        style={{ width: 28, height: 28, marginRight: 6 }}
                        resizeMode="contain"
                    />
                    <Text
                        className="text-gray-500"
                        style={{ fontSize: Math.max(chatFontSize - 2, 12) }}
                    >
                        실비가 생각 중이에요...
                    </Text>
                </View>
            </View>
        );
    };

    const handleChipPress = useCallback(
        (label) => {
            const sentence = expandSuggestion(label, userRegionLabel);
            setInput(sentence);
            requestAnimationFrame(() => onSend(sentence));
        },
        [onSend, userRegionLabel],
    );

    return (
        <SafeAreaView edges={[]} className="flex-1 bg-[#f7f8f7]">
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
            >
                <View className="flex-1">
                    <FlatList
                        ref={listRef}
                        data={messages}
                        keyExtractor={(it) => it.id}
                        renderItem={renderItem}
                        ListHeaderComponent={
                            <ChatHeader
                                name={name}
                                chatFontSize={chatFontSize}
                                onChipPress={handleChipPress}
                            />
                        }
                        ListFooterComponent={renderFooter}
                        contentContainerStyle={{
                            paddingHorizontal: 16,
                            paddingBottom: 16,
                            flexGrow: 1,
                        }}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode={
                            Platform.OS === 'ios' ? 'interactive' : 'on-drag'
                        }
                        showsVerticalScrollIndicator={false}
                    />
                </View>

                <View
                    style={{
                        paddingBottom: Math.max(insets.bottom - 25, 6),
                    }}
                    className="px-4 border-t border-gray-200/70"
                >
                    <View
                        className="
                            flex-row items-center
                            rounded-2xl
                            px-3 py-2
                            bg-white
                            border border-gray-200
                            shadow-sm
                        "
                    >
                        <TouchableOpacity
                            className="w-10 h-10 mr-1 items-center justify-center"
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            onPress={() => {
                                navigation.navigate('VoiceChat', {
                                    sessionId,
                                    // 🎙️ 음성 챗봇에도 동일 코드 전달
                                    regionCode: effectiveRegionCode,
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
                            placeholder="궁금한 내용을 입력해 주세요"
                            placeholderTextColor="#9CA3AF"
                            value={input}
                            onChangeText={setInput}
                            returnKeyType="send"
                            onSubmitEditing={() => canSend && onSend()}
                            blurOnSubmit={Platform.OS === 'ios'}
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
