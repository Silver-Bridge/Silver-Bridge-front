// mobile/src/screens/mypage/FontSettingScreen.js

import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSignup } from '../signup/SignupContext';

// 5단계 크기 정의 (16pt 부터 2pt씩 증가: 16, 18, 20, 22, 24)
const FONT_SIZES = [16, 18, 20, 22, 24]; // 총 5단계
// 각 단계별 직관적인 한글 라벨
const SIZE_LABELS = ['아주 작게', '조금 작게', '보통', '조금 크게', '크게'];

// 폰트 크기 슬라이더 구현을 위한 핵심 유틸리티 (5단계 -> 100 / 4 = 25)
const FONT_SCALE_UNIT = 100 / (FONT_SIZES.length - 1);

// Context의 scale 값을 받아 인덱스(0~4)를 반환
const getIndexFromScale = (scale) => Math.round(scale / FONT_SCALE_UNIT);
// 인덱스를 받아 실제 폰트 크기(pt)를 반환
const getSizeFromIndex = (index) => FONT_SIZES[index];
// 인덱스를 받아 Context에 저장할 scale 값 (0~100)을 반환
const getScaleFromIndex = (index) => index * FONT_SCALE_UNIT;


// 임시 PrimaryButton 컴포넌트
const PrimaryButton = ({ title, onPress, disabled }) => (
    <TouchableOpacity
        className={`mx-4 rounded-xl py-4 items-center ${disabled ? 'bg-gray-300' : 'bg-teal-600'}`}
        onPress={onPress}
        disabled={disabled}
    >
        <Text className="text-white text-base font-bold">{title}</Text>
    </TouchableOpacity>
);


export default function FontSettingScreen() {
    const navigation = useNavigation();
    const { data, setData } = useSignup();

    const initialIndex = getIndexFromScale(data.fontScale);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    const currentSize = getSizeFromIndex(currentIndex);
    const currentLabel = SIZE_LABELS[currentIndex];

    // 미리보기 텍스트
    const previewText = [
        '안녕하세요! 실버브릿지입니다',
        '오늘 하루도 힘차게 시작해볼까요?',
        '오늘은 별일 없으셨나요?',
        '나가실 계획이 있으시다면 우산 꼭 챙기세요',
    ];

    // [최종 수정 반영] 조절바의 각 눈금 (5단계) 렌더링 함수
    const renderScale = () => {
        return FONT_SIZES.map((size, index) => {
            const isCurrent = index === currentIndex;

            return (
                // [수정 반영] flex-1을 사용하여 모든 눈금의 간격을 균등하게 분배합니다.
                // 마지막 눈금은 따로 처리하지 않고, flex-1을 유지하여 간격이 동일하게 보이도록 합니다.
                <View key={index} className="flex-1 items-center z-20">
                    <TouchableOpacity
                        className={`w-4 h-4 rounded-full border-2 
                                    ${isCurrent
                            ? 'bg-teal-600 border-teal-600'
                            : 'bg-white border-gray-400'
                        } 
                                    shadow-sm`}
                        onPress={() => setCurrentIndex(index)}
                        activeOpacity={0.8}
                        style={{
                            transform: [{ scale: isCurrent ? 1.2 : 1 }],
                        }}
                    >
                        {/* 조절바 핸들 역할 */}
                    </TouchableOpacity>

                    {/* 각 눈금 아래에 라벨 표시 */}
                    <Text
                        className={`text-sm mt-3 ${isCurrent ? 'font-bold text-teal-600' : 'text-gray-500'}`}
                        style={{ fontSize: 12 }}
                    >
                        {SIZE_LABELS[index]}
                    </Text>
                </View>
            );
        });
    };

    // 확인 버튼 로직: 변경된 폰트 크기를 Context에 저장
    const handleConfirm = () => {
        const newFontScale = getScaleFromIndex(currentIndex); // 0~100 값으로 변환
        setData(s => ({ ...s, fontScale: newFontScale }));
        Alert.alert("설정 완료", `글자 크기가 '${currentLabel}'로 저장되었습니다.`);
        navigation.goBack();
    };


    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1">
                {/* 헤더 */}
                <View className="flex-row items-center py-4 px-4 border-b border-gray-200">
                    <TouchableOpacity onPress={() => navigation.goBack()}><Text className="text-2xl">{'←'}</Text></TouchableOpacity>
                    <Text className="text-xl font-bold ml-4">글자 크기 설정</Text>
                </View>

                <View className="flex-1 px-6 pt-6">
                    {/* 폰트 크기 표시 */}
                    <Text className="text-center text-lg font-bold mb-4 text-teal-600">
                        현재 설정: {currentLabel} ({currentSize} pt)
                    </Text>

                    {/* 미리보기 영역 (실시간 폰트 크기 변경 확인) */}
                    <View className="rounded-xl overflow-hidden bg-gray-50 p-4 shadow-md">
                        <View className="rounded-xl overflow-hidden">
                            <View className="bg-white px-4 py-4">
                                {previewText.map((t, i) => (
                                    <View
                                        key={i}
                                        className={`rounded-xl px-3 py-2 mb-2 ${i % 2 === 0 ? 'self-start bg-blue-100/70' : 'self-end bg-gray-200/70'}`}
                                        style={{ maxWidth: '80%' }}
                                    >
                                        <Text
                                            // 폰트 크기 실시간 반영
                                            style={{ fontSize: currentSize }}
                                            className="text-gray-800"
                                        >
                                            {t}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* 조절바 및 라벨 */}
                    <View className="mt-12 mb-8 px-2">

                        {/* 슬라이더 트랙 영역 */}
                        <View className="relative w-full h-4 items-center justify-center">

                            {/* 배경선: 모든 점을 연결하는 회색선 */}
                            <View
                                className="absolute h-0.5 bg-gray-300 rounded-full"
                                style={{
                                    width: '90%',
                                    left: '5%',
                                    top: 6
                                }}
                            />

                            {/* 조절바 컴포넌트: flex-row로 균등하게 배치 */}
                            <View className="flex-row w-full h-full items-start justify-between">
                                {renderScale()}
                            </View>
                        </View>
                    </View>
                </View>

                {/* 확인 버튼 영역 */}
                <View className="mb-8">
                    <PrimaryButton title="확인" onPress={handleConfirm} disabled={false} />
                </View>

            </View>
        </SafeAreaView>
    );
}