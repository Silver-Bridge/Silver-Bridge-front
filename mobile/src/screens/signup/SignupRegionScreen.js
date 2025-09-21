// src/screens/signup/SignupRegionScreen.js
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import Header from './_parts/Header';
import PrimaryButton from './_parts/PrimaryButton';
import { useSignup } from './SignupContext';
import { getRegionsApi } from '../../shared/api/meta';

export default function SignupRegionScreen({ navigation }) {
    const { data, setData } = useSignup();
    const [open, setOpen] = useState(false);
    const [regions, setRegions] = useState([]);
    const [loading, setLoading] = useState(true);

    // 지역 목록 로드(목업 API)
    useEffect(() => {
        (async () => {
            try {
                const list = await getRegionsApi(); // ['서울', '경기', ...]
                setRegions(list);
            } catch (e) {
                console.log('지역 목록 로드 실패:', e?.response?.data ?? e?.message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const canNext = !!data.region;

    const onSelect = (region) => {
        setData((s) => ({ ...s, region }));
        setOpen(false);
    };

    return (
        <View className="flex-1 bg-white">
            <Header title="지역을 선택해주세요" />

            <View className="px-6 pt-6">
                {/* 셀렉터 */}
                <TouchableOpacity
                    className="border border-gray-300 rounded-xl px-4 py-4 flex-row justify-between"
                    onPress={() => setOpen(true)}
                    activeOpacity={0.85}
                >
                    <Text className={`text-[15px] ${data.region ? 'text-gray-900' : 'text-gray-400'}`}>
                        {data.region || '지역'}
                    </Text>
                    <Text className="text-gray-500">▾</Text>
                </TouchableOpacity>
            </View>

            {/* 다음 버튼 */}
            <PrimaryButton
                title="다음"
                onPress={() => navigation.navigate('SignupFont')}
                disabled={!canNext}
            />

            {/* 액션시트 모달 */}
            <Modal
                animationType="slide"
                transparent
                visible={open}
                onRequestClose={() => setOpen(false)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/30 justify-end"
                    activeOpacity={1}
                    onPress={() => setOpen(false)}
                >
                    <View className="bg-white rounded-t-2xl p-4">
                        <Text className="text-base font-semibold mb-3">거주지역</Text>

                        {loading ? (
                            <View className="py-6 items-center">
                                <ActivityIndicator />
                            </View>
                        ) : (
                            <FlatList
                                data={regions}
                                keyExtractor={(it, idx) => `${it}-${idx}`}
                                ItemSeparatorComponent={() => <View className="h-px bg-gray-100" />}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        className="py-3 flex-row items-center justify-between"
                                        onPress={() => onSelect(item)}
                                    >
                                        <Text className="text-[16px] text-gray-900">{item}</Text>
                                        {data.region === item ? <Text className="text-teal-600">✓</Text> : null}
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
