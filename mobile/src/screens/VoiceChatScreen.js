// /src/screens/VoiceChatScreen.js
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    ScrollView,
    Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendVoice } from '../shared/api/chatbot';
import { useChatFontSize } from '../shared/utils/useChatFont';

function regionLabelToCode(regionLabel) {
    if (!regionLabel) return 'std';

    const t = regionLabel.trim();

    if (t === '경상도') return 'gs';
    if (t === '강원도') return 'gw';

    return 'std';
}

export default function VoiceChatScreen() {
    const insets = useSafeAreaInsets();
    const route = useRoute();

    const { chatFontSize } = useChatFontSize(16);

    const initialSessionId = route.params?.sessionId ?? null;
    const paramRegionCode = route.params?.regionCode ?? null;

    const [isRecording, setIsRecording] = useState(false);
    const [recording, setRecording] = useState(null);
    const [lastReply, setLastReply] = useState(null);
    const [sending, setSending] = useState(false);
    const [voiceSessionId, setVoiceSessionId] = useState(initialSessionId);
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const [regionCode, setRegionCode] = useState(paramRegionCode || 'std');
    const [userRegionLabel, setUserRegionLabel] = useState('');

    const pulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem('USER_INFO');
                const u = raw ? JSON.parse(raw) : null;

                const label = u?.region || '';
                setUserRegionLabel(label);

                if (!paramRegionCode && label) {
                    setRegionCode(regionLabelToCode(label));
                }
            } catch (e) {
                console.warn(
                    '[VoiceChat] USER_INFO load error:',
                    e?.message ?? String(e),
                );
            }
        })();
    }, [paramRegionCode]);

    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync().catch(() => {});
            }
            setIsPlaying(false);
        };
    }, [sound]);

    useEffect(() => {
        if (isRecording) {
            const looping = Animated.loop(
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
            );
            looping.start();
            return () => looping.stop();
        } else {
            pulse.stopAnimation();
            pulse.setValue(0);
        }
    }, [isRecording, pulse]);

    const outerScale = pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.4],
    });
    const outerOpacity = pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.25, 0.0],
    });

    const playReplyAudio = useCallback(
        async (url) => {
            if (!url) return;
            try {
                if (sound) {
                    await sound.unloadAsync();
                    setSound(null);
                }

                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
                });

                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: url },
                    { shouldPlay: true },
                    (status) => {
                        if (status.isLoaded) {
                            if (status.isPlaying) {
                                setIsPlaying(true);
                            } else if (status.didJustFinish) {
                                setIsPlaying(false);
                                newSound.unloadAsync().catch(() => {});
                                setSound(null);
                            }
                        }
                    },
                );
                setSound(newSound);
                setIsPlaying(true);
            } catch (e) {
                console.warn('playReplyAudio error:', e?.message ?? String(e));
                setIsPlaying(false);
            }
        },
        [sound],
    );

    //음성 멈추기
    const stopAudio = useCallback(async () => {
        if (!sound) return;
        try {
            await sound.stopAsync();
        } catch (e) {
            console.warn('stopAudio stopAsync error:', e?.message ?? String(e));
        }
        try {
            await sound.unloadAsync();
        } catch (e) {
            console.warn('stopAudio unloadAsync error:', e?.message ?? String(e));
        }
        setSound(null);
        setIsPlaying(false);
    }, [sound]);

    //  녹음 시작
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
                Audio.RecordingOptionsPresets.HIGH_QUALITY, // m4a
            );

            setRecording(recording);
            setIsRecording(true);
        } catch (e) {
            console.warn('startRecording error:', e);
            setIsRecording(false);
        }
    }, []);

    // 녹음 종료 + 서버 전송
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

            const res = await sendVoice({
                uri,
                regionCode,
                sessionId: voiceSessionId,
                region: userRegionLabel,
            });
            console.log('[VOICE RES in voice screen]', res);

            if (!voiceSessionId && res?.sessionId) {
                setVoiceSessionId(res.sessionId);
            }

            let replyText = res?.replyText || null;

            if (!replyText && Array.isArray(res?.history)) {
                const lastAssistant = [...res.history]
                    .reverse()
                    .find((m) => (m.role || '').toLowerCase() !== 'user');
                if (lastAssistant?.content) {
                    replyText = lastAssistant.content;
                }
            }

            setLastReply(replyText);

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
    }, [
        recording,
        voiceSessionId,
        playReplyAudio,
        regionCode,
        userRegionLabel,
    ]);

    const toggleRecording = useCallback(() => {
        if (sending) return;
        if (isRecording) stopRecording();
        else startRecording();
    }, [isRecording, startRecording, stopRecording, sending]);

    const statusLabel = isRecording
        ? '지금 말씀하시는 중이에요.'
        : sending
            ? '답변을 준비하고 있어요.'
            : '버튼을 누르고 천천히 말씀해 주세요.';

    return (
        <SafeAreaView edges={[]} className="flex-1 bg-[#f7f8f7]">
            <View
                style={{
                    paddingTop: 32,
                    paddingBottom: 16,
                }}
                className="flex-1 px-6"
            >
                <View className="w-full">
                    <View className="flex-row items-center mb-4">
                        <View
                            style={{ width: 44, height: 44 }}
                            className="rounded-full bg-[#e2f1dd] items-center justify-center mr-3"
                        >
                            <Image
                                source={require('../../assets/logo.png')}
                                style={{ width: 30, height: 30 }}
                                resizeMode="contain"
                            />
                        </View>
                        <View className="flex-1">
                            <Text
                                className="text-gray-900 font-semibold"
                                style={{ fontSize: 22 }}
                                numberOfLines={1}
                            >
                                실비에게 말 걸기
                            </Text>
                            <Text
                                className="text-gray-500 mt-1"
                                style={{ fontSize: 15 }}
                            >
                                버튼을 눌러 말씀하시고, 다시 눌러 전송해 주세요.
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row items-center self-start px-3 py-2 rounded-full bg-white border border-gray-200 shadow-sm">
                        <MaterialCommunityIcons
                            name={isRecording ? 'record-rec' : 'information-outline'}
                            size={20}
                            color={isRecording ? '#dc2626' : '#6b7280'}
                        />
                        <Text
                            className="ml-2 text-gray-800"
                            style={{ fontSize: 16 }}
                        >
                            {statusLabel}
                        </Text>
                    </View>
                </View>

                <View className="items-center justify-center flex-1">
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
                    <TouchableOpacity onPress={toggleRecording} activeOpacity={0.9}>
                        <View className="w-[170px] h-[170px] rounded-full bg-[#0f766e] items-center justify-center shadow-lg">
                            <MaterialCommunityIcons
                                name={isRecording ? 'microphone' : 'microphone-outline'}
                                size={80}
                                color="#ffffff"
                            />
                        </View>
                    </TouchableOpacity>
                </View>

                <View
                    className="w-full bg-white rounded-3xl px-5 py-5 shadow-md border border-gray-100"
                    style={{ minHeight: 130, maxHeight: 320 }}
                >
                    <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center">
                            <Image
                                source={require('../../assets/logo.png')}
                                style={{ width: 26, height: 26, marginRight: 8 }}
                                resizeMode="contain"
                            />
                            <Text
                                className="font-semibold text-gray-800"
                                style={{ fontSize: 17 }}
                            >
                                실비의 답변
                            </Text>
                        </View>

                        {isPlaying && (
                            <TouchableOpacity
                                onPress={stopAudio}
                                activeOpacity={0.8}
                                className="flex-row items-center px-3 py-1 rounded-full bg-gray-100"
                            >
                                <MaterialCommunityIcons
                                    name="volume-off"
                                    size={18}
                                    color="#4b5563"
                                />
                                <Text className="ml-1 text-[12px] text-gray-700">
                                    음성 멈추기
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {sending ? (
                        <View className="flex-row items-center">
                            <Image
                                source={require('../../assets/silvy_loading.gif')}
                                style={{ width: 40, height: 40, marginRight: 8 }}
                                resizeMode="contain"
                            />
                            <Text className="text-gray-700" style={{ fontSize: 16 }}>
                                답변을 준비하고 있어요...
                            </Text>
                        </View>
                    ) : lastReply ? (
                        <ScrollView showsVerticalScrollIndicator>
                            <Text
                                className="text-gray-800"
                                style={{
                                    fontSize: chatFontSize,
                                    lineHeight: chatFontSize + 4,
                                }}
                            >
                                {lastReply}
                            </Text>
                        </ScrollView>
                    ) : (
                        <Text className="text-gray-400" style={{ fontSize: 15 }}>
                            음성으로 질문하시면, 여기에서 크게 답변이 보여집니다.
                        </Text>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}
