// src/shared/components/AppText.js
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useFontScale } from '../utils/fontScaleContext';

export default function AppText({ style, children, ...rest }) {
    const { fontScale } = useFontScale();
    const flat = StyleSheet.flatten(style) || {};
    const baseSize = flat.fontSize || 16;

    return (
        <Text
            {...rest}
            style={[style, { fontSize: baseSize * fontScale }]}
        >
            {children}
        </Text>
    );
}
