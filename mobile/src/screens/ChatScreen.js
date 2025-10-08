import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen() {
    const route = useRoute();
    const [input, setInput] = useState('');
    const inputRef = useRef(null);

    // Home에서 넘어온 preset을 자동 입력
    useEffect(() => {
        const preset = route.params?.preset ?? '';
        if (typeof preset === 'string') {
            setInput(preset);
            // 약간 늦게 포커스 주면 키보드도 자연스럽게 올라옴
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [route.params?.preset]);

    const send = () => {
        if (!input.trim()) return;
        // TODO: 실제 전송 로직 (목업/봇 연동)
        console.log('send:', input);
        setInput('');
    };

    return (
        <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-white">
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View className="flex-1">
                    {/* 채팅 내용 영역(목업) */}
                    <View className="flex-1 items-center justify-center">
                        <Text className="text-gray-400">여기에 대화가 표시됩니다</Text>
                    </View>

                    {/* 입력 바 */}
                    <View className="px-4 pb-3">
                        <View className="flex-row items-center bg-gray-100 rounded-2xl px-3 py-2">
                            <TextInput
                                ref={inputRef}
                                className="flex-1 px-2 py-2 text-[15px]"
                                placeholder="메시지를 입력하세요"
                                value={input}
                                onChangeText={setInput}
                                returnKeyType="send"
                                onSubmitEditing={send}
                            />
                            <TouchableOpacity onPress={send} className="w-10 h-10 rounded-full bg-teal-600 items-center justify-center" activeOpacity={0.85}>
                                <Ionicons name="send" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
