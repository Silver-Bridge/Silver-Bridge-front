// src/shared/utils/useChatFont.js
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_INFO_KEY = 'USER_INFO';

// SignupFontScreen 과 동일하게 유지
const FONT_SIZES = [16, 18, 20, 22, 24];
const SIZE_LABELS = ['아주 작게', '조금 작게', '보통', '조금 크게', '크게'];

export function useChatFontSize(defaultSize = 16) {
    const [chatFontSize, setChatFontSize] = useState(defaultSize);
    const [label, setLabel] = useState('보통');

    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(USER_INFO_KEY);
                if (!raw) return;

                const info = JSON.parse(raw);
                const textsize = info?.textsize || '보통';

                // 라벨 → 인덱스 찾기
                const idx = SIZE_LABELS.indexOf(textsize);
                if (idx >= 0) {
                    setChatFontSize(FONT_SIZES[idx]); // 🔹 바로 폰트 사이즈로 매핑
                    setLabel(textsize);
                } else {
                    setChatFontSize(defaultSize);
                    setLabel('보통');
                }
            } catch (e) {
                console.log('Failed to load USER_INFO for chat font', e);
            }
        })();
    }, [defaultSize]);

    return { chatFontSize, label };
}
