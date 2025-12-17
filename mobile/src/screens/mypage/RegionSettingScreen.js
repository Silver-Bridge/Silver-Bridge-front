// mobile/src/screens/mypage/RegionSettingScreen.js

import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Image,
    Alert,
    ActivityIndicator,
    TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSignup } from '../signup/SignupContext';
import regionImages from '../../shared/assets/regionImages';
import { updateRegion } from '../../shared/api/user';

const REGIONS = ['경상도', '강원도', '서울'];
const USER_INFO_KEY = 'USER_INFO';

export default function RegionSettingScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { data, setData } = useSignup();

    const [modalVisible, setModalVisible] = useState(false);
    const [currentRegion, setCurrentRegion] = useState(data.region || '');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // USER_INFO에서 region 불러오기
    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(USER_INFO_KEY);
                if (raw) {
                    const info = JSON.parse(raw);
                    if (info.region && REGIONS.includes(info.region)) {
                        setCurrentRegion(info.region);
                        setData((s) => ({ ...s, region: info.region }));
                    } else if (!currentRegion) {
                        setCurrentRegion('경상도');
                        setData((s) => ({ ...s, region: '경상도' }));
                    }
                } else if (!currentRegion) {
                    setCurrentRegion('경상도');
                    setData((s) => ({ ...s, region: '경상도' }));
                }
            } catch (e) {
                console.log(
                    '[RegionSetting] load USER_INFO error:',
                    e?.message || e,
                );
                if (!currentRegion) {
                    setCurrentRegion('경상도');
                    setData((s) => ({ ...s, region: '경상도' }));
                }
            } finally {
                setLoading(false);
            }
        })();
    }, [setData]);

    const selectedImageSource = useMemo(() => {
        const key = currentRegion || '경상도';
        return regionImages[key] || regionImages['경상도'];
    }, [currentRegion]);

    const applyRegionChange = async (regionName) => {
        try {
            setSaving(true);

            await updateRegion(regionName);

            // 2) USER_INFO 갱신
            const raw = await AsyncStorage.getItem(USER_INFO_KEY);
            const info = raw ? JSON.parse(raw) : {};
            const newInfo = {
                ...info,
                region: regionName,
            };
            await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(newInfo));

            setCurrentRegion(regionName);
            setData((s) => ({ ...s, region: regionName }));

            Alert.alert('완료', `${regionName} 방언으로 변경되었어요.`);
        } catch (e) {
            console.log('[RegionSetting] update error:', e?.message || e);
            Alert.alert('오류', '지역을 변경하는 중 문제가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleRegionSelect = (regionName) => {
        setModalVisible(false);

        if (currentRegion === regionName) return;

        Alert.alert(
            '지역 변경 확인',
            `지역을 ${regionName} 방언으로 변경하시겠습니까?`,
            [
                { text: '아니오', style: 'cancel' },
                {
                    text: '네',
                    onPress: () => {
                        if (!saving) {
                            applyRegionChange(regionName);
                        }
                    },
                },
            ],
            { cancelable: false },
        );
    };

    const canSave = !!currentRegion && !saving && !loading;

    return (
        <SafeAreaView
            className="flex-1 bg-white"
            edges={['left', 'right', 'top']}
        >
            <View className="flex-row items-center px-4 pt-3 pb-2 border-b border-gray-100">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="pr-3 py-1"
                >
                    <Text className="text-2xl text-gray-900">{'←'}</Text>
                </TouchableOpacity>
                <View className="flex-1 items-center">
                    <Text className="text-lg font-semibold text-gray-900">
                        지역 설정
                    </Text>
                </View>
                <View style={{ width: 32 }} />
            </View>

            <View className="flex-1 items-center px-4 mt-4">
                <View
                    style={{
                        width: '100%',
                        maxWidth: 480,
                    }}
                >
                    <View className="w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden">
                        <Image
                            source={selectedImageSource}
                            className="w-full h-72"
                            resizeMode="contain"
                        />
                    </View>

                    <Text className="mt-3 text-center text-[17px] text-gray-700">
                        현재 선택:{' '}
                        <Text className="font-semibold text-teal-700">
                            {loading
                                ? '불러오는 중...'
                                : currentRegion
                                    ? `${currentRegion} 방언`
                                    : '지역을 선택해주세요'}
                        </Text>
                    </Text>

                    <Text className="mt-2 text-center text-[14px] text-gray-500">
                        선택한 지역에 맞춰 챗봇의 사투리/방언이 적용됩니다.
                    </Text>

                    <View className="mt-7">
                        <Text className="mb-2 text-[18px] text-gray-500">
                            거주 지역
                        </Text>
                        <TouchableOpacity
                            className="border border-gray-300 rounded-2xl px-4 py-4 flex-row justify-between items-center"
                            onPress={() => !saving && setModalVisible(true)}
                            activeOpacity={0.85}
                            disabled={saving || loading}
                        >
                            <Text
                                className={`text-[16px] ${
                                    currentRegion
                                        ? 'text-gray-900'
                                        : 'text-gray-400'
                                }`}
                            >
                                {loading
                                    ? '불러오는 중...'
                                    : currentRegion || '지역을 선택해주세요'}
                            </Text>
                            <Text className="text-gray-500 text-[18px]">
                                ▾
                            </Text>
                        </TouchableOpacity>

                        {saving && (
                            <View className="mt-2 flex-row items-center">
                                <ActivityIndicator size="small" />
                                <Text className="ml-2 text-sm text-gray-500">
                                    지역 정보를 저장하는 중입니다...
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            <View
                className="px-6 border-t border-gray-100 bg-white"
                style={{ paddingBottom: insets.bottom + 10, paddingTop: 10 }}
            >
                <View
                    style={{
                        width: '100%',
                        maxWidth: 480,
                        alignSelf: 'center',
                    }}
                >
                    <TouchableOpacity
                        className={`rounded-2xl py-4 items-center ${
                            canSave ? 'bg-teal-600' : 'bg-gray-300'
                        }`}
                        activeOpacity={canSave ? 0.8 : 1}
                        disabled={!canSave}
                        onPress={() => {
                            navigation.goBack();
                        }}
                    >
                        <Text className="text-white text-lg font-bold">
                            완료
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Modal
                animationType="slide"
                transparent
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/30 justify-end"
                    activeOpacity={1}
                    onPressOut={() => setModalVisible(false)}
                >
                    <TouchableWithoutFeedback>
                        <View
                            className="bg-white rounded-t-3xl pt-2 pb-4 px-4 max-h-[80%]"
                            style={{
                                width: '100%',
                                maxWidth: 720,
                                alignSelf: 'center',
                            }}
                        >
                            <View className="self-center w-10 h-1.5 rounded-full bg-gray-300 mb-3" />

                            <Text className="text-[17px] font-semibold mb-3">
                                거주 지역을 선택해주세요
                            </Text>

                            {loading ? (
                                <View className="py-6 items-center">
                                    <ActivityIndicator />
                                </View>
                            ) : (
                                REGIONS.map((region) => {
                                    const isSelected =
                                        currentRegion === region;
                                    return (
                                        <TouchableOpacity
                                            key={region}
                                            className={`py-3 px-2 mb-1 flex-row items-center justify-between rounded-xl ${
                                                isSelected
                                                    ? 'bg-teal-50'
                                                    : 'bg-white'
                                            }`}
                                            onPress={() =>
                                                handleRegionSelect(region)
                                            }
                                            activeOpacity={0.8}
                                        >
                                            <Text
                                                className={`text-[17px] ${
                                                    isSelected
                                                        ? 'text-teal-700 font-semibold'
                                                        : 'text-gray-900'
                                                }`}
                                            >
                                                {region}
                                            </Text>
                                            {isSelected ? (
                                                <Text className="text-teal-600 text-[18px]">
                                                    ✓
                                                </Text>
                                            ) : null}
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}
