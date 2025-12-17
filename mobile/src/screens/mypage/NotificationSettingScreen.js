// mobile/src/screens/mypage/NotificationSettingScreen.js

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateAlarm } from '../../shared/api/user';

const USER_INFO_KEY = 'USER_INFO';

export default function NotificationSettingScreen() {
    const navigation = useNavigation();
    const [alarmActive, setAlarmActive] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(USER_INFO_KEY);
                if (raw) {
                    const info = JSON.parse(raw);
                    if (typeof info.alarmActive === 'boolean') {
                        setAlarmActive(info.alarmActive);
                    }
                }
            } catch (e) {
                console.log('[NotificationSetting] load USER_INFO error:', e?.message || e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleSave = async () => {
        try {
            setSaving(true);

            await updateAlarm(alarmActive);

            // 2) USER_INFO 갱신
            const raw = await AsyncStorage.getItem(USER_INFO_KEY);
            const info = raw ? JSON.parse(raw) : {};
            const newInfo = {
                ...info,
                alarmActive,
            };
            await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(newInfo));

            Alert.alert('완료', '알림 설정이 저장되었습니다.', [
                { text: '확인', onPress: () => navigation.goBack() },
            ]);
        } catch (e) {
            console.log('[NotificationSetting] save error:', e?.message || e);
            Alert.alert('오류', '알림 설정을 저장하는 중 문제가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView className="flex-1">
                <View className="flex-row items-center py-4 px-4 border-b border-gray-200">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text className="text-2xl">{'←'}</Text>
                    </TouchableOpacity>
                    <Text className="text-xl font-bold ml-4">알림 설정</Text>
                </View>

                <View className="p-6">
                    <View className="flex-row items-center justify-between py-4">
                        <View className="flex-1 pr-4">
                            <Text className="text-base text-gray-900 font-semibold">
                                일정 및 안내 알림 받기
                            </Text>
                            <Text className="text-xs text-gray-500 mt-1">
                                복약 알림, 병원 예약 안내, 챗봇 주요 알림 등을 수신합니다.
                            </Text>
                        </View>
                        <Switch
                            value={alarmActive}
                            onValueChange={setAlarmActive}
                            disabled={loading || saving}
                        />
                    </View>

                    {saving && (
                        <Text className="mt-2 text-xs text-gray-500">
                            설정을 저장하는 중입니다...
                        </Text>
                    )}
                </View>
            </ScrollView>

            <TouchableOpacity
                className={`m-4 rounded-xl py-4 items-center ${
                    saving || loading ? 'bg-gray-300' : 'bg-teal-600'
                }`}
                onPress={handleSave}
                disabled={saving || loading}
            >
                <Text className="text-white text-base font-bold">
                    {saving ? '저장 중...' : '저장하기'}
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
