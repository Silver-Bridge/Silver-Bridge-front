// src/shared/utils/fontScaleContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FontScaleContext = createContext({
    fontScale: 1,
    textSizeLabel: '보통',
});

export function FontScaleProvider({ children }) {
    const [fontScale, setFontScale] = useState(1);
    const [textSizeLabel, setTextSizeLabel] = useState('보통');

    useEffect(() => {
        const load = async () => {
            try {
                const storedScale = await AsyncStorage.getItem('FONT_SCALE');
                const storedLabel = await AsyncStorage.getItem('TEXT_SIZE_LABEL');

                if (storedScale != null) {
                    const n = Number(storedScale);    // 0 ~ 100
                    const ratio = 0.9 + (n / 100) * 0.2; // 0→0.9, 50→1.0, 100→1.1
                    setFontScale(ratio);
                }
                if (storedLabel) setTextSizeLabel(storedLabel);
            } catch (e) {
                console.log('Failed to load font scale', e);
            }
        };
        load();
    }, []);

    return (
        <FontScaleContext.Provider value={{ fontScale, textSizeLabel }}>
            {children}
        </FontScaleContext.Provider>
    );
}

export function useFontScale() {
    return useContext(FontScaleContext);
}
