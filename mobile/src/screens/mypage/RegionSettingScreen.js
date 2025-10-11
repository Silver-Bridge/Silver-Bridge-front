// mobile/src/screens/mypage/RegionSettingScreen.js (수정된 최종 코드)

import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Modal, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSignup } from '../signup/SignupContext';
import regionImages from '../../shared/assets/regionImages';

// 지원하는 지역 목록
const REGIONS = ['경상도', '전라도', '충청도'];

export default function RegionSettingScreen() {
    const navigation = useNavigation();
    const { data, setData } = useSignup();
    const [modalVisible, setModalVisible] = useState(false);

    // [수정된 부분] 초기값은 항상 Zustand에 저장된 지역을 사용합니다.
    const [currentRegion, setCurrentRegion] = useState(data.region);

    // 드롭다운에서 지역을 선택했을 때 실행
    const handleRegionSelect = (regionName) => {
        setModalVisible(false); // 드롭다운 닫기

        // 현재 지역과 다를 경우에만 변경 확인 팝업 띄우기
        if (currentRegion !== regionName) {
            Alert.alert(
                "지역 변경 확인",
                `지역을 ${regionName} 방언으로 변경하시겠습니까?`,
                [
                    { text: "아니오", style: "cancel" },
                    {
                        text: "네",
                        onPress: () => {
                            // 1. 상태 및 Context 업데이트 (Zustand에 저장)
                            setCurrentRegion(regionName);
                            setData(s => ({ ...s, region: regionName }));
                        }
                    }
                ],
                { cancelable: false }
            );
        }
    };

    // [수정된 부분] currentRegion에 해당하는 이미지만을 사용합니다.
    // 만약 데이터에 없으면, 기본값으로 '경상도' 이미지를 표시하도록 fallback을 설정합니다.
    const selectedImageSource = regionImages[currentRegion] || regionImages['경상도'];

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 p-6 items-center">

                {/* 헤더 및 드롭다운 버튼 */}
                <View className="w-full flex-row justify-center relative mb-8">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="absolute left-0 top-1">
                        <Text className="text-2xl">{'←'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-row items-center justify-center p-2 rounded-lg"
                        onPress={() => setModalVisible(true)}
                    >
                        <Text className="text-xl font-bold mr-2">{currentRegion}</Text>
                        <Text className="text-xl">▼</Text>
                    </TouchableOpacity>
                </View>

                {/* 지역 지도 이미지 (고정 이미지 표시) */}
                <View className="w-full max-w-md aspect-[0.9] items-center justify-center border border-gray-300 rounded-lg overflow-hidden">
                    <Image
                        source={selectedImageSource}
                        className="w-full h-full resize-contain"
                    />
                </View>

                <Text className="mt-4 text-center text-lg text-gray-700">
                    현재 챗봇 서비스에는 <Text className="font-bold text-red-600">{currentRegion}</Text> 방언이 적용됩니다.
                </Text>

            </View>

            {/* 지역 선택 드롭다운 메뉴 (Modal 구현) */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    className="flex-1 justify-start items-center pt-20 bg-black/30"
                    onPress={() => setModalVisible(false)} // 배경 클릭 시 닫기
                >
                    <View className="bg-white rounded-lg w-64 shadow-xl">
                        {REGIONS.map((region) => (
                            <TouchableOpacity
                                key={region}
                                className={`py-3 px-4 border-b ${currentRegion === region ? 'bg-teal-100' : 'bg-white'}`}
                                onPress={() => handleRegionSelect(region)}
                            >
                                <Text className={`text-lg ${currentRegion === region ? 'font-bold text-teal-700' : 'text-gray-800'}`}>
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