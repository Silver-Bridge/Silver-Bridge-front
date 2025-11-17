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

    const renderItem = ({ item, index }) => {
        const updated = new Date(item.updatedAt || item.createdAt);
        const label = `대화 ${item.id}번`;
        const timeText = updated.toLocaleString();

        return (
            <TouchableOpacity
                onPress={() => openSession(item)}
                activeOpacity={0.85}
                style={{
                    marginHorizontal: 16,
                    marginBottom: 10,
                    borderRadius: 18,
                    backgroundColor: 'white',
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    // 살짝 그림자
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 4,
                    elevation: 2,
                }}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                        <Text
                            className="text-[16px] font-semibold text-gray-900"
                            numberOfLines={1}
                        >
                            {label}

                        </Text>
                        <Text
                            className="text-[13px] text-gray-500 mt-1"
                            numberOfLines={1}
                        >
                            최근에 본 시간: {timeText}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => remove(item)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="trash-outline" size={22} color="#CBD5E1" />
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
            <View className="px-4 pt-3 pb-1">
                <Text className="text-[20px] font-bold text-gray-900 mb-1">
                    내 대화방
                </Text>
                <Text className="text-[13px] text-gray-500">
                    지난 대화를 다시 보거나, 새 대화를 시작할 수 있어요.
                </Text>

                {/* 새 대화 버튼 – 화면 폭 꽉 차게, 크게 */}
                <TouchableOpacity
                    onPress={createAndOpen}
                    activeOpacity={0.9}
                    style={{
                        marginTop: 14,
                        borderRadius: 999,
                        backgroundColor: '#0f766e',
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
                    <Text className="text-white text-[15px] font-semibold ml-2">
                        새 대화 시작하기
                    </Text>
                </TouchableOpacity>
            </View>

            {/* 구분선 */}
            <View className="mt-2 mb-1 px-4">
                <Text className="text-[14px] font-semibold text-gray-700">
                    대화 기록
                </Text>
            </View>

            {/* 리스트 */}
              <FlatList
                      data={sessions}
                      keyExtractor={(it) => String(it.id)}
                      renderItem={renderItem}
                      contentContainerStyle={{
                        paddingTop: 2,
                        // ✅ 탭바랑 살짝만 띄우기 (insets.bottom 더하기)
                        paddingBottom: Math.max(insets.bottom, 2),
                      }}
                ListEmptyComponent={
                    <View className="items-center justify-center py-20 px-6">
                        <Text className="text-[14px] text-gray-500 mb-3 text-center">
                            아직 저장된 대화가 없습니다.
                        </Text>
                        <TouchableOpacity
                            onPress={createAndOpen}
                            activeOpacity={0.9}
                            style={{
                                borderRadius: 999,
                                backgroundColor: '#0f766e',
                                paddingVertical: 10,
                                paddingHorizontal: 20,
                            }}
                        >
                            <Text className="text-white text-[14px] font-semibold">
                                첫 대화 시작하기
                            </Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
