// src/screens/signup/SignupRegionScreen.js (JS 버전)

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
import Header from './_parts/Header';
import PrimaryButton from './_parts/PrimaryButton';
import { useSignup } from './SignupContext';
import regionImages from '../../shared/assets/regionImages';

const REGIONS = ['경상도', '전라도', '충청도']; // 필요시 확장

// 기본 폴백 지역 목록 (API 실패 대비)
const FALLBACK_REGIONS = ['경상도', '전라도', '충청도'];

export default function SignupRegionScreen({ navigation }) {
    const { data, setData } = useSignup();

    const [open, setOpen] = useState(false);
    const [regions, setRegions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentRegion, setCurrentRegion] = useState(data.region || '');

    // 이미지 소스 (없으면 경상도 폴백)
    const selectedImageSource = useMemo(() => {
        const r = currentRegion || '경상도';
        return regionImages[r] || regionImages['경상도'];
    }, [currentRegion]);

    useEffect(() => {
          setRegions(REGIONS);
          setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                        setData((s) => ({ ...s, region: regionName })); // 컨텍스트 반영
                    },
                },
            ],
            { cancelable: false }
        );
    };

    const onNext = () => {
        if (currentRegion && currentRegion !== data.region) {
            setData((s) => ({ ...s, region: currentRegion }));
        }
        navigation.navigate('SignupFont');
    };

    return (
        <View className="flex-1 bg-white">
            <Header title="지역을 선택해주세요" />

            {/* 미리보기 이미지 */}
            <View className="px-6 mt-4">
                <View className="w-full items-center justify-center border border-gray-300 rounded-lg overflow-hidden">
                    <Image source={selectedImageSource} className="w-full h-48 resize-contain" />
                </View>
                <Text className="mt-3 text-center text-[15px] text-gray-700">
                    현재 선택: <Text className="font-semibold text-teal-700">{currentRegion || '지역 선택'}</Text>
                </Text>
            </View>

            {/* 셀렉터 버튼 */}
            <View className="px-6 pt-6">
                <TouchableOpacity
                    className="border border-gray-300 rounded-xl px-4 py-4 flex-row justify-between"
                    onPress={() => setOpen(true)}
                    activeOpacity={0.85}
                >
                    <Text className={`text-[15px] ${currentRegion ? 'text-gray-900' : 'text-gray-400'}`}>
                        {currentRegion || '지역'}
                    </Text>
                    <Text className="text-gray-500">▾</Text>
                </TouchableOpacity>
            </View>

            {/* 다음 버튼 */}
            <PrimaryButton title="다음" onPress={onNext} disabled={!canNext} />

            {/* 액션시트 모달 */}
            <Modal animationType="slide" transparent visible={open} onRequestClose={() => setOpen(false)}>
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
                                        className={`py-3 flex-row items-center justify-between ${
                                            currentRegion === item ? 'bg-teal-50' : 'bg-white'
                                        }`}
                                        onPress={() => handleSelect(item)}
                                    >
                                        <Text
                                            className={`text-[16px] ${
                                                currentRegion === item ? 'text-teal-700 font-semibold' : 'text-gray-900'
                                            }`}
                                        >
                                            {item}
                                        </Text>
                                        {currentRegion === item ? <Text className="text-teal-600">✓</Text> : null}
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
