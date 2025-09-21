import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

export default function PrimaryButton({ title, onPress, disabled }) {
    return (
        <TouchableOpacity
            className={`mt-8 mx-4 rounded-xl py-4 items-center ${disabled ? 'bg-teal-300' : 'bg-teal-600'}`}
            activeOpacity={0.85}
            disabled={disabled}
            onPress={onPress}
        >
            <Text className="text-white font-bold text-[16px]">{title}</Text>
        </TouchableOpacity>
    );
}
