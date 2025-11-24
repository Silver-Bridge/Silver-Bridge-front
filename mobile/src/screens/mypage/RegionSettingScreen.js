// mobile/src/screens/mypage/RegionSettingScreen.js

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSignup } from '../signup/SignupContext';
import regionImages from '../../shared/assets/regionImages';
import { updateRegion } from '../../shared/api/user';

const REGIONS = ['경상도', '전라도', '충청도'];
const USER_INFO_KEY = 'USER_INFO';

export default function RegionSettingScreen() {
    const navigation = useNavigation();
    const { data, setData } = useSignup();

    const [modalVisible, setModalVisible] = useState(false);
    const [currentRegion, setCurrentRegion] = useState(data.region || '경상도');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(USER_INFO_KEY);
                if (raw) {
                    const info = JSON.parse(raw);
                    if (info.region && REGIONS.includes(info.region)) {
                        setCurrentRegion(info.region);
                        setData((s) => ({ ...s, region: info.region }));
                    }
                }
            } catch (e) {
                console.log('[RegionSetting] load USER_INFO error:', e?.message || e);
            } finally {
                setLoading(false);
            }
        })();
    }, [setData]);

    // ✅ DB + 로컬 모두 반영
    const applyRegionChange = async (regionName) => {
        try {
            setSaving(true);

            // 1) 백엔드 (PATCH /api/mypage/member/region)
            await updateRegion(regionName); // ✅ 여기 수정 (객체 → 문자열)

            // 2) USER_INFO 갱신
            const raw = await AsyncStorage.getItem(USER_INFO_KEY);
            const info = raw ? JSON.parse(raw) : {};
            const newInfo = {
                ...info,
                region: regionName,
            };
            await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(newInfo));

            // 3) 컨텍스트/화면 갱신
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

    const selectedImageSource =
        regionImages[currentRegion] || regionImages['경상도'];

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 p-6 items-center">
                {/* 헤더 + 드롭다운 */}
                <View className="w-full flex-row justify-center relative mb-8">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="absolute left-0 top-1"
                    >
                        <Text className="text-2xl">{'←'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-row items-center justify-center p-2 rounded-lg"
                        onPress={() => !saving && setModalVisible(true)}
                        disabled={saving}
                    >
                        <Text className="text-xl font-bold mr-2">
                            {loading ? '불러오는 중...' : currentRegion}
                        </Text>
                        <Text className="text-xl">▼</Text>
                    </TouchableOpacity>
                </View>

                {/* 지역 지도 이미지 */}
                <View className="w-full max-w-md aspect-[0.9] items-center justify-center border border-gray-300 rounded-lg overflow-hidden">
                    <Image
                        source={selectedImageSource}
                        className="w-full h-full resize-contain"
                    />
                </View>

                <Text className="mt-4 text-center text-lg text-gray-700">
                    현재 챗봇 서비스에는{' '}
                    <Text className="font-bold text-red-600">
                        {loading ? '...' : currentRegion}
                    </Text>{' '}
                    방언이 적용됩니다.
                </Text>

                {saving && (
                    <Text className="mt-2 text-sm text-gray-500">
                        지역 정보를 저장하는 중입니다...
                    </Text>
                )}
            </View>

            {/* 지역 선택 드롭다운 */}
            <Modal
                animationType="fade"
                transparent
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    className="flex-1 justify-start items-center pt-20 bg-black/30"
                    onPress={() => setModalVisible(false)}
                    activeOpacity={1}
                >
                    <View className="bg-white rounded-lg w-64 shadow-xl">
                        {REGIONS.map((region) => (
                            <TouchableOpacity
                                key={region}
                                className={`py-3 px-4 border-b ${
                                    currentRegion === region ? 'bg-teal-100' : 'bg-white'
                                }`}
                                onPress={() => handleRegionSelect(region)}
                            >
                                <Text
                                    className={`text-lg ${
                                        currentRegion === region
                                            ? 'font-bold text-teal-700'
                                            : 'text-gray-800'
                                    }`}
                                >
                                    {region} 방언
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}
