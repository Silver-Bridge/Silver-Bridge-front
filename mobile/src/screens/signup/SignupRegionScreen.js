// src/screens/signup/SignupRegionScreen.js

import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from './_parts/Header';
import PrimaryButton from './_parts/PrimaryButton';
import { useSignup } from './SignupContext';
import regionImages from '../../shared/assets/regionImages';

const REGIONS = ['경상도', '강원도', '서울'];
const FALLBACK_REGIONS = ['경상도', '강원도', '서울'];

export default function SignupRegionScreen({ navigation }) {
    const { data, setData } = useSignup();
    const insets = useSafeAreaInsets();

    const [open, setOpen] = useState(false);
    const [regions, setRegions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentRegion, setCurrentRegion] = useState(data.region || '');

    const selectedImageSource = useMemo(() => {
        const r = currentRegion || '경상도';
        return regionImages[r] || regionImages['경상도'];
    }, [currentRegion]);

    useEffect(() => {
        setRegions(REGIONS.length ? REGIONS : FALLBACK_REGIONS);
        setLoading(false);
    }, []);

    const canNext = !!currentRegion;

    const handleSelect = (regionName) => {
        setOpen(false);
        if (currentRegion === regionName) return;

        Alert.alert(
            '지역 변경 확인',
            `지역을 ${regionName} 방언으로 설정할까요?`,
            [
                { text: '아니오', style: 'cancel' },
                {
                    text: '네',
                    onPress: () => {
                        setCurrentRegion(regionName);
                        setData((s) => ({ ...s, region: regionName }));
                    },
                },
            ],
            { cancelable: false },
        );
    };

    const onNext = () => {
        if (currentRegion && currentRegion !== data.region) {
            setData((s) => ({ ...s, region: currentRegion }));
        }
        navigation.navigate('SignupFont');
    };

    return (
        <SafeAreaView
            className="flex-1 bg-white"
            edges={['left', 'right', 'bottom']}   // 상단은 Header에서 처리
        >
            {/* 상단 헤더 */}
            <Header title="지역을 선택해주세요" />

            {/* 본문 영역 - 가운데 정렬 + 최대 폭 고정 */}
            <View className="flex-1 items-center px-4 mt-4">
                <View
                    style={{
                        width: '100%',
                        maxWidth: 480,
                    }}
                >
                    {/* 미리보기 이미지 카드 */}
                    <View className="w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden">
                        <Image
                            source={selectedImageSource}
                            className="w-full h-72"
                            resizeMode="contain"
                        />
                    </View>

                    {/* 현재 선택 텍스트 */}
                    <Text className="mt-3 text-center text-[17px] text-gray-700">
                        현재 선택:{' '}
                        <Text className="font-semibold text-teal-700">
                            {currentRegion || '지역을 선택해주세요'}
                        </Text>
                    </Text>

                    {/* 셀렉터 라벨 + 버튼 */}
                    <View className="mt-7">
                        <Text className="mb-2 text-[18px] text-gray-500">거주 지역</Text>
                        <TouchableOpacity
                            className="border border-gray-300 rounded-2xl px-4 py-4 flex-row justify-between items-center"
                            onPress={() => setOpen(true)}
                            activeOpacity={0.85}
                        >
                            <Text
                                className={`text-[16px] ${
                                    currentRegion ? 'text-gray-900' : 'text-gray-400'
                                }`}
                            >
                                {currentRegion || '지역을 선택해주세요'}
                            </Text>
                            <Text className="text-gray-500 text-[18px]">▾</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* 하단 버튼 - 가운데 + 최대 폭 고정 */}
            <View
                className="px-6"
                style={{ paddingBottom: insets.bottom + 10 }}
            >
                <View
                    style={{
                        width: '100%',
                        maxWidth: 480,
                        alignSelf: 'center',
                    }}
                >
                    <PrimaryButton title="다음" onPress={onNext} disabled={!canNext} />
                </View>
            </View>

            {/* 지역 선택 모달 */}
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
                    <View
                        className="bg-white rounded-t-3xl pt-5 pb-7 px-5 max-h-[92%]"
                        style={{
                            width: '100%',
                            maxWidth: 720,
                            alignSelf: 'center',
                        }}
                    >
                        {/* 상단 핸들바 */}
                        <View className="self-center w-12 h-1.5 rounded-full bg-gray-300 mb-4" />

                        <Text className="text-[20px] font-semibold mb-4">
                            거주 지역을 선택해주세요
                        </Text>

                        {loading ? (
                            <View className="py-6 items-center">
                                <ActivityIndicator />
                            </View>
                        ) : (
                            <FlatList
                                data={regions}
                                keyExtractor={(it, idx) => `${it}-${idx}`}
                                ItemSeparatorComponent={() => (
                                    <View className="h-px bg-gray-100" />
                                )}
                                renderItem={({ item }) => {
                                    const isSelected = currentRegion === item;
                                    return (
                                        <TouchableOpacity
                                            className={`py-4 flex-row items-center justify-between rounded-xl px-2 ${
                                                isSelected ? 'bg-teal-50' : 'bg-white'
                                            }`}
                                            onPress={() => handleSelect(item)}
                                            activeOpacity={0.8}
                                        >
                                            <Text
                                                className={`text-[19px] ${
                                                    isSelected
                                                        ? 'text-teal-700 font-semibold'
                                                        : 'text-gray-900'
                                                }`}
                                            >
                                                {item}
                                            </Text>
                                            {isSelected ? (
                                                <Text className="text-teal-600 text-[22px]">
                                                    ✓
                                                </Text>
                                            ) : null}
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}
