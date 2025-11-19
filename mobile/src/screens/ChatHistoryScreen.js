// /src/screens/ChatHistoryScreen.js
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getSessions, deleteSession } from '../shared/api/chatbot';

export default function ChatHistoryScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [sessions, setSessions] = useState([]);

    const refresh = async () => {
        try {
            const list = await getSessions();
            const sorted = Array.isArray(list)
                ? [...list].sort(
                    (a, b) =>
                        new Date(b.updatedAt || b.createdAt) -
                        new Date(a.updatedAt || a.createdAt),
                )
                : [];
            setSessions(sorted);
        } catch (e) {
            console.log('[history] getSessions error:', e?.message || e);
            setSessions([]);
        }
    };

    const resetToChatMain = (params) => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'ChatMain', params }],
        });
    };

    useEffect(() => {
        const unsub = navigation.addListener('focus', refresh);
        return unsub;
    }, [navigation]);

    const openSession = (s) => {
        resetToChatMain({
            sessionId: s.id,
            regionCode: s.regionCode || 'std',
            title: '내 스토리',
        });
    };

    const createAndOpen = () => {
        resetToChatMain({ title: '새 대화' });
    };

    const remove = (s) => {
        Alert.alert('대화 삭제', '이 대화를 지울까요?', [
            { text: '취소' },
            {
                text: '삭제',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteSession(s.id);
                        refresh();
                    } catch (e) {
                        console.log('[history] deleteSession error:', e?.message || e);
                    }
                },
            },
        ]);
    };

    const renderItem = ({ item }) => {
        const updated = new Date(item.updatedAt || item.createdAt);

        // 🔹 백엔드에서 내려주는 첫 질문 필드 우선 사용
        const firstQuestion =
            item.firstQuestion ||
            item.firstUserMessage ||
            item.firstMessage ||
            item.title || '';

        // 🔹 첫 질문이 있으면 그걸 타이틀로, 없으면 예전처럼 fallback
        const label =
            firstQuestion && firstQuestion.trim().length > 0
                ? firstQuestion.trim()
                : `대화 ${item.id}번`;

        const timeText = updated.toLocaleString();

        return (
            <TouchableOpacity
                onPress={() => openSession(item)}
                activeOpacity={0.85}
                style={{
                    marginHorizontal: 18,
                    marginBottom: 12,
                    borderRadius: 20,
                    backgroundColor: 'white',
                    paddingVertical: 16,
                    paddingHorizontal: 18,
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 5,
                    elevation: 3,
                }}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                        {/* 🔹 타이틀 글자 키움 */}
                        <Text
                            className="text-[18px] font-semibold text-gray-900"
                            numberOfLines={1}
                        >
                            {label}
                        </Text>
                        {/* 🔹 시간 글자도 키움 */}
                        <Text
                            className="text-[14px] text-gray-500 mt-2"
                            numberOfLines={1}
                        >
                            최근에 본 시간: {timeText}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => remove(item)}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        {/* 🔹 휴지통 아이콘도 조금 키움 */}
                        <Ionicons name="trash-outline" size={24} color="#CBD5E1" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView
            edges={['bottom']}
            style={{
                flex: 1,
                backgroundColor: '#f5f6f8',
            }}
        >
            {/* 상단 안내 영역 */}
            <View className="px-4 pt-4 pb-2">
                {/* 새 대화 버튼 – 화면 폭 꽉 차게, 크게 */}
                <TouchableOpacity
                    onPress={createAndOpen}
                    activeOpacity={0.9}
                    style={{
                        marginTop: 10,
                        borderRadius: 999,
                        backgroundColor: '#0f766e',
                        paddingVertical: 14,
                        paddingHorizontal: 18,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
                    <Text className="text-white text-[17px] font-semibold ml-3">
                        새 대화 시작하기
                    </Text>
                </TouchableOpacity>
            </View>

            {/* 리스트 */}
            <FlatList
                data={sessions}
                keyExtractor={(it) => String(it.id)}
                renderItem={renderItem}
                contentContainerStyle={{
                    paddingTop: 4,
                    paddingBottom: Math.max(insets.bottom + 4, 10),
                }}
                ListEmptyComponent={
                    <View className="items-center justify-center py-20 px-6">
                        <Text className="text-[16px] text-gray-500 mb-4 text-center">
                            아직 저장된 대화가 없습니다.
                        </Text>
                        <TouchableOpacity
                            onPress={createAndOpen}
                            activeOpacity={0.9}
                            style={{
                                borderRadius: 999,
                                backgroundColor: '#0f766e',
                                paddingVertical: 12,
                                paddingHorizontal: 24,
                            }}
                        >
                            <Text className="text-white text-[16px] font-semibold">
                                첫 대화 시작하기
                            </Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
