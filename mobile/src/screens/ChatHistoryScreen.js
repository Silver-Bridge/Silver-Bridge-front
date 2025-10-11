import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LocalStore } from '../shared/chat/localStore';

export default function ChatHistoryScreen() {
    const navigation = useNavigation();
    const [threads, setThreads] = useState([]);

    const refresh = async () => {
        try {
            const list = await LocalStore.loadThreads();
            setThreads(list);
        } catch (e) {
            console.log(e);
        }
    };

    useEffect(() => { refresh(); }, []);

    const openThread = (t) => {
        navigation.navigate('ChatMain', { threadId: t.id, title: t.title });
    };

    const remove = (t) => {
        Alert.alert('삭제', '이 대화방을 삭제할까요?', [
            { text: '취소' },
            { text: '삭제', style: 'destructive', onPress: async () => {
                await LocalStore.deleteThread(t.id);
                refresh(); } },
        ]);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => openThread(item)} className="px-4 py-3 border-b border-gray-100">
            <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                    <Text className="text-[15px] font-semibold text-gray-900" numberOfLines={1}>{item.title}</Text>
                    <Text className="text-[12px] text-gray-500 mt-0.5" numberOfLines={1}>{item.lastText || '메시지 없음'}</Text>
                </View>
                <TouchableOpacity onPress={() => remove(item)} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
                    <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
                </TouchableOpacity>
            </View>
            <Text className="text-[11px] text-gray-400 mt-1">{new Date(item.updatedAt).toLocaleString()}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-white">
            <View className="px-4 py-3 border-b border-gray-100">
                <Text className="text-[17px] font-bold text-gray-900">대화 기록</Text>
            </View>
            <FlatList
                data={threads}
                keyExtractor={(it) => it.id}
                renderItem={renderItem}
                ListEmptyComponent={
                    <View className="items-center justify-center py-20">
                        <Text className="text-gray-400">저장된 대화가 없습니다.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
