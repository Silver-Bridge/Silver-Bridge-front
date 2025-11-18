// /src/screens/VoiceChatScreen.js
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { sendVoice } from '../shared/api/chatbot';

export default function VoiceChatScreen() {
    const insets = useSafeAreaInsets();

    const [isRecording, setIsRecording] = useState(false);
    const [recording, setRecording] = useState(null);
    const [lastReply, setLastReply] = useState(null);      // 최근 답변 텍스트
    const [sending, setSending] = useState(false);
    const [voiceSessionId, setVoiceSessionId] = useState(null); // 음성 세션 유지
    const [sound, setSound] = useState(null);              // 재생 중인 사운드 객체

    // ⭐ 동그라미 애니메이션 값
    const pulse = useRef(new Animated.Value(0)).current;

    // 컴포넌트 언마운트 시, 사운드 정리
    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync().catch(() => {});
            }
        };
    }, [sound]);

    // 녹음 ON/OFF에 따라 애니메이션 시작/정지
    useEffect(() => {
        if (isRecording) {
            // 0 → 1 → 0 반복
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulse, {
                        toValue: 1,
                        duration: 700,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulse, {
                        toValue: 0,
                        duration: 700,
                        useNativeDriver: true,
                    }),
                ]),
            ).start();
        } else {
            pulse.stopAnimation();
            pulse.setValue(0);
        }
    }, [isRecording, pulse]);

    const outerScale = pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.4], // 얼마나 커질지
    });
    const outerOpacity = pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.25, 0.0],
    });

    // 🎧 서버에서 내려준 replyAudioUrl 재생
    const playReplyAudio = useCallback(
        async (url) => {
            if (!url) return;
            try {
                // 이전 사운드 있으면 정리
                if (sound) {
                    await sound.unloadAsync();
                    setSound(null);
                }

                // 사운드 생성 + 즉시 재생
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: url },
                    { shouldPlay: true } // 바로 재생
                );
                setSound(newSound);
            } catch (e) {
                console.warn('playReplyAudio error:', e?.message ?? String(e));
            }
        },
        [sound]
    );

    // 🎤 녹음 시작
    const startRecording = useCallback(async () => {
        try {
            const perm = await Audio.requestPermissionsAsync();
            if (!perm.granted) {
                alert('마이크 권한이 필요합니다.');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY // m4a
            );

            setRecording(recording);
            setIsRecording(true);
        } catch (e) {
            console.warn('startRecording error:', e);
            setIsRecording(false);
        }
    }, []);

    // 🎤 녹음 종료 + 서버 전송
    const stopRecording = useCallback(async () => {
        try {
            if (!recording) return;
            setIsRecording(false);
            setSending(true);

            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);

            if (!uri) {
                console.warn('no recording uri');
                setSending(false);
                return;
            }

            // ✅ 현재 voiceSessionId를 함께 보냄 → 세션 유지
            const res = await sendVoice({
                uri,
                regionCode: 'std',
                sessionId: voiceSessionId,
            });
            console.log('[VOICE RES in voice screen]', res);

            // 서버가 세션 ID 내려주면, 없던 경우에만 세팅
            if (!voiceSessionId && res?.sessionId) {
                setVoiceSessionId(res.sessionId);
            }

            // 최근 답변 텍스트 화면에 표시
            const replyText = res?.replyText || null;
            setLastReply(replyText);

            // 🔊 서버에서 내려준 TTS 오디오 URL 재생
            if (res?.replyAudioUrl) {
                await playReplyAudio(res.replyAudioUrl);
            } else {
                console.log('[VOICE] replyAudioUrl이 없어, 텍스트만 표시합니다.');
            }
        } catch (e) {
            console.warn('stopRecording error:', e?.message ?? String(e));
        } finally {
            setSending(false);
        }
    }, [recording, voiceSessionId, playReplyAudio]);

    const toggleRecording = useCallback(() => {
        if (sending) return;
        if (isRecording) stopRecording();
        else startRecording();
    }, [isRecording, startRecording, stopRecording, sending]);

    return (
        <SafeAreaView
            edges={['top', 'bottom']}
            className="flex-1 bg-[#f7f8f7]"
        >
            <View
                style={{ paddingTop: 24, paddingBottom: 16 + insets.bottom }}
                className="flex-1 items-center justify-between px-6"
            >
                {/* 상단 안내 영역 */}
                <View className="w-full mt-6 items-center">
                    <Text className="text-[18px] font-semibold text-gray-900 mb-2">
                        음성 대화
                    </Text>
                    <Text className="text-[14px] text-gray-600 text-center">
                        {isRecording
                            ? '지금 말씀해 주세요. 다시 누르면 전송됩니다.'
                            : '가운데 버튼을 눌러 말씀해 주세요.'}
                    </Text>
                </View>

                {/* 가운데 마이크 원형 영역 */}
                <View className="items-center justify-center">
                    {/* 퍼지는 바깥 원 */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            width: 220,
                            height: 220,
                            borderRadius: 110,
                            backgroundColor: '#0f766e',
                            opacity: outerOpacity,
                            transform: [{ scale: outerScale }],
                        }}
                    />
                    {/* 안쪽 실제 버튼 */}
                    <TouchableOpacity
                        onPress={toggleRecording}
                        activeOpacity={0.9}
                    >
                        <View className="w-[160px] h-[160px] rounded-full bg-[#0f766e] items-center justify-center shadow-lg">
                            <MaterialCommunityIcons
                                name={isRecording ? 'microphone' : 'microphone-outline'}
                                size={64}
                                color="#ffffff"
                            />
                        </View>
                    </TouchableOpacity>

                    <Text className="mt-4 text-[13px] text-gray-500">
                        {isRecording
                            ? '녹음 중...'
                            : sending
                                ? '서버에 전송 중...'
                                : '한 번 누르면 시작 / 다시 누르면 전송'}
                    </Text>
                </View>

                {/* 하단: 마지막 답변 텍스트 크게 표시 (어르신용) */}
                <View className="w-full bg-white rounded-3xl px-4 py-5 shadow-sm min-h-[120px]">
                    <Text className="text-[15px] font-semibold text-gray-800 mb-2">
                        챗봇 답변
                    </Text>
                    {lastReply ? (
                        <Text className="text-[16px] leading-6 text-gray-800">
                            {lastReply}
                        </Text>
                    ) : (
                        <Text className="text-[13px] text-gray-400">
                            음성으로 질문하시면, 여기 크게 답변이 보여집니다.
                        </Text>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}
