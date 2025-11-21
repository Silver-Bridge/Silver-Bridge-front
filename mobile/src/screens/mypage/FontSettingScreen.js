// mobile/src/screens/mypage/FontSettingScreen.js

import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateTextsize } from '../../shared/api/user';

const USER_INFO_KEY = 'USER_INFO';
const FONT_SCALE_KEY = 'FONT_SCALE';

// 5단계 크기 정의 (16pt 부터 2pt씩 증가: 16, 18, 20, 22, 24)
const FONT_SIZES = [14, 16, 18, 20, 22];
const SIZE_LABELS = ['아주 작게', '조금 작게', '보통', '조금 크게', '크게'];

const FONT_SCALE_UNIT = 100 / (FONT_SIZES.length - 1);

// 인덱스를 받아 실제 폰트 크기(pt)를 반환
const getSizeFromIndex = (index) => FONT_SIZES[index];
// 인덱스를 받아 0~100 사이 scale 값으로 변환
const getScaleFromIndex = (index) => index * FONT_SCALE_UNIT;

// 라벨 → 인덱스 매핑
const LABEL_TO_INDEX = SIZE_LABELS.reduce((acc, label, idx) => {
    acc[label] = idx;
    return acc;
}, {});

// 공용 버튼
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

    const [currentIndex, setCurrentIndex] = useState(2); // 기본값: "보통"
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const currentSize = getSizeFromIndex(currentIndex);
    const currentLabel = SIZE_LABELS[currentIndex];

    // ▶ 진입 시, USER_INFO.textsize 기준으로 초기 인덱스 설정
    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(USER_INFO_KEY);
                if (raw) {
                    const info = JSON.parse(raw);
                    const label = info.textsize; // "아주 작게" ~ "크게"
                    const idx =
                        LABEL_TO_INDEX[label] !== undefined ? LABEL_TO_INDEX[label] : 2;
                    setCurrentIndex(idx);
                } else {
                    setCurrentIndex(2); // 보통
                }
            } catch (e) {
                console.log('[FontSetting] load USER_INFO error:', e?.message || e);
                setCurrentIndex(2);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const previewText = [
        '안녕하세요! 실버브릿지입니다',
        '오늘 하루도 힘차게 시작해볼까요?',
        '오늘은 별일 없으셨나요?',
        '나가실 계획이 있으시다면 우산 꼭 챙기세요',
    ];

    const renderScale = () => {
        return FONT_SIZES.map((size, index) => {
            const isCurrent = index === currentIndex;

            return (
                <View key={index} className="flex-1 items-center z-20">
                    <TouchableOpacity
                        className={`w-4 h-4 rounded-full border-2 ${
                            isCurrent ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-400'
                        } shadow-sm`}
                        onPress={() => setCurrentIndex(index)}
                        activeOpacity={0.8}
                        style={{
                            transform: [{ scale: isCurrent ? 1.2 : 1 }],
                        }}
                    />
                    <Text
                        className={`text-sm mt-3 ${
                            isCurrent ? 'font-bold text-teal-600' : 'text-gray-500'
                        }`}
                        style={{ fontSize: 12 }}
                    >
                        {SIZE_LABELS[index]}
                    </Text>
                </View>
            );
        });
    };

    // ✅ 핵심: DB + 로컬 둘 다 업데이트
    const handleConfirm = async () => {
        const newLabel = currentLabel;
        const newFontScale = getScaleFromIndex(currentIndex);

        setSaving(true);
        try {
            // 1) 🔹 백엔드에 먼저 반영 (DB 업데이트)
            //    토큰 기반 인증이 이미 jwtAxios에 붙어있다고 가정
            await updateTextsize({ textsize: newLabel });

            // 2) 로컬 USER_INFO / FONT_SCALE도 갱신
            const raw = await AsyncStorage.getItem(USER_INFO_KEY);
            const info = raw ? JSON.parse(raw) : {};
            const newInfo = {
                ...info,
                textsize: newLabel,
            };

            await AsyncStorage.multiSet([
                [USER_INFO_KEY, JSON.stringify(newInfo)],
                [FONT_SCALE_KEY, String(newFontScale)],
            ]);

            Alert.alert('설정 완료', `글자 크기가 '${newLabel}'로 저장되었습니다.`);
            navigation.goBack();
        } catch (e) {
            console.log('[FontSetting] save error:', e?.message || e);
            Alert.alert('오류', '글자 크기 설정을 저장하는 중 문제가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1">
                {/* 헤더 */}
                <View className="flex-row items-center py-4 px-4 border-b border-gray-200">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text className="text-2xl">{'←'}</Text>
                    </TouchableOpacity>
                    <Text className="text-xl font-bold ml-4">글자 크기 설정</Text>
                </View>

                <View className="flex-1 px-6 pt-6">
                    <Text className="text-center text-lg font-bold mb-4 text-teal-600">
                        {loading
                            ? '현재 설정을 불러오는 중...'
                            : `현재 설정: ${currentLabel} (${currentSize} pt)`}
                    </Text>

                    {/* 미리보기 */}
                    <View className="rounded-xl overflow-hidden bg-gray-50 p-4 shadow-md">
                        <View className="rounded-xl overflow-hidden">
                            <View className="bg-white px-4 py-4">
                                {previewText.map((t, i) => (
                                    <View
                                        key={i}
                                        className={`rounded-xl px-3 py-2 mb-2 ${
                                            i % 2 === 0 ? 'self-start bg-blue-100/70' : 'self-end bg-gray-200/70'
                                        }`}
                                        style={{ maxWidth: '80%' }}
                                    >
                                        <Text style={{ fontSize: currentSize }} className="text-gray-800">
                                            {t}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* 조절바 */}
                    <View className="mt-12 mb-8 px-2">
                        <View className="relative w-full h-4 items-center justify-center">
                            <View
                                className="absolute h-0.5 bg-gray-300 rounded-full"
                                style={{ width: '90%', left: '5%', top: 6 }}
                            />
                            <View className="flex-row w-full h-full items-start justify-between">
                                {renderScale()}
                            </View>
                        </View>
                    </View>
                </View>

                <View className="mb-8">
                    <PrimaryButton
                        title={saving ? '저장 중...' : '확인'}
                        onPress={handleConfirm}
                        disabled={loading || saving}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}
