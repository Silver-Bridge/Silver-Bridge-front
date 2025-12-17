// src/screens/calendar/ScheduleSearchScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';

import { searchSchedulesApi } from '../../shared/api/calendar';

const SearchResultItem = ({ item }) => (
    <View className="py-3 border-b border-gray-100">
        <Text className="text-xs text-gray-500">
            {item.alarm_time
                ? moment(item.alarm_time).format('YYYY.MM.DD (ddd)')
                : '날짜 정보 없음'}
        </Text>
        <Text className="text-base font-medium text-gray-800">
            {item.title || '(제목 없음)'}
        </Text>
    </View>
);

export default function ScheduleSearchScreen() {
    const navigation = useNavigation();

    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        if (searchQuery.trim().length < 1) {
            setResults([]);
            setSearched(false);
            setLoading(false);
            return;
        }

        const handler = setTimeout(() => {
            performSearch(searchQuery);
        }, 500);

        return () => clearTimeout(handler);
    }, [searchQuery]);

    const performSearch = async (query) => {
        setLoading(true);
        setSearched(true);

        try {
            const data = await searchSchedulesApi({ query });

            setResults(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Search failed:', e.message);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center p-4 border-b border-gray-200">
                <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
                    <Text className="text-2xl">{'←'}</Text>
                </TouchableOpacity>

                <View className="flex-1 flex-row items-center border border-gray-300 rounded-lg px-3 py-1 bg-gray-50">
                    <Text className="mr-2 text-xl text-gray-500">🔍</Text>
                    <TextInput
                        placeholder="키워드를 입력하세요. (예: 병원)"
                        className="flex-1 text-base py-1"
                        autoFocus={true}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        clearButtonMode="while-editing"
                    />
                </View>
            </View>

            <View className="p-4 flex-1">
                {loading ? (
                    <ActivityIndicator className="mt-10" />
                ) : !searched ? (
                    <Text className="text-base text-gray-500 text-center mt-10">
                        검색 키워드를 입력해 주세요.
                    </Text>
                ) : results.length > 0 ? (
                    <FlatList
                        data={results}
                        keyExtractor={(item, index) =>
                            (item.id ?? item.scheduleId ?? index).toString()
                        }
                        renderItem={({ item }) => <SearchResultItem item={item} />}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <Text className="text-base text-gray-500 text-center mt-10">
                        '{searchQuery}'에 해당하는 일정이 없습니다.
                    </Text>
                )}
            </View>
        </SafeAreaView>
    );
}
