// src/screens/settings/AlarmSettingScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Switch, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../signup/_parts/Header';
import jwtAxios from '../../shared/api/client.js';

export default function AlarmSettingScreen({ navigation }) {
    const [alarmActive, setAlarmActive] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadFromStorage = useCallback(async () => {
        try {
            const raw = await AsyncStorage.getItem('USER_INFO');
            if (raw) {
                const info = JSON.parse(raw);
                if (typeof info.alarmActive === 'boolean') {
                    setAlarmActive(info.alarmActive);
                } else {
                    setAlarmActive(true);
                }
            } else {
                setAlarmActive(true);
            }
        } catch (e) {
            console.warn('[ALARM] load error', e);
            setAlarmActive(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFromStorage();
    }, [loadFromStorage]);

    const updateAlarm = async (nextValue) => {
        setSaving(true);
        try {
            await jwtAxios.patch('/api/users/me/alarm', {
                alarmActive: nextValue,
            });

            // USER_INFO 갱신
            const raw = await AsyncStorage.getItem('USER_INFO');
            let info = {};
            if (raw) {
                info = JSON.parse(raw);
            }
            info.alarmActive = nextValue;
            await AsyncStorage.setItem('USER_INFO', JSON.stringify(info));
        } catch (e) {
            console.warn('[ALARM] update error', e);
            setAlarmActive((prev) => !nextValue);
            Alert.alert('안내', '알림 설정을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setSaving(false);
        }
    };

    const onToggle = async (value) => {
        setAlarmActive(value);
        await updateAlarm(value);
    };

    if (loading) {
        return (
            <View className="flex-1 bg-white">
                <Header title="알림 설정" />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" />
                    <Text className="mt-3 text-gray-600">알림 설정을 불러오는 중입니다...</Text>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <Header title="알림 설정" />

            <View className="px-6 pt-8">
                <Text className="text-xl font-bold text-gray-900 mb-4">
                    병원 일정 및 주요 안내 알림
                </Text>
                <Text className="text-base text-gray-600 mb-8 leading-6">
                    실버브릿지가 등록된 일정, 복약 알림, 중요한 안내 사항을 알려드릴 때 사용하는
                    알림이에요.{"\n"}
                    필요하신 경우에만 꺼두셔도 됩니다.
                </Text>

                <View className="flex-row items-center justify-between bg-gray-50 rounded-2xl px-4 py-4">
                    <View className="flex-1 pr-4">
                        <Text className="text-lg font-semibold text-gray-900 mb-1">
                            알림 받기
                        </Text>
                        <Text className="text-sm text-gray-600">
                            병원 예약, 일정, 챗봇 안내 등을 푸시 알림으로 알려드려요.
                        </Text>
                    </View>

                    <Switch
                        value={alarmActive}
                        onValueChange={onToggle}
                        disabled={saving}
                        trackColor={{ false: '#d1d5db', true: '#14b8a6' }}
                        thumbColor="#ffffff"
                    />
                </View>

                {saving && (
                    <Text className="mt-3 text-sm text-teal-600">
                        알림 설정을 저장하고 있습니다...
                    </Text>
                )}

                <View className="mt-10">
                    <Text className="text-xs text-gray-500 leading-5">
                        ※ 알림이 켜져 있어도 기기 설정에서 앱 알림이 차단되어 있으면
                        메시지가 도착하지 않을 수 있어요.{"\n"}
                        휴대폰 설정 &gt; 알림 &gt; 실버브릿지 앱의 알림 허용 상태도 함께 확인해주세요.
                    </Text>
                </View>
            </View>
        </View>
    );
}
