// mobile/src/shared/hooks/useAlarmPolling.js

import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { checkCalendarAlarm } from '../api/calendar';

function formatKoreanTime(isoString) {
    if (!isoString) return '';

    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
        return isoString;
    }

    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h < 12 ? '오전' : '오후';

    if (h === 0) h = 12;
    else if (h > 12) h -= 12;

    const mm = m.toString().padStart(2, '0');
    return `${ampm} ${h}:${mm}`;
}

export function useAlarmPolling() {
    const appState = useRef(AppState.currentState);
    const intervalRef = useRef(null);

    const handleAlarms = async () => {
        try {
            const items = await checkCalendarAlarm();

            if (!Array.isArray(items) || items.length === 0) {
                return;
            }

            const first = items[0];

            // 🔹 우선순위: start_at / startAt / startTime
            const rawStart =
                first.start_at ||
                first.startAt ||
                first.startTime ||
                null;

            const timeText = rawStart ? formatKoreanTime(rawStart) : '';

            let bodyText = '일정 알림이 도착했습니다.';

            if (timeText && first.title) {
                bodyText = `${timeText} · ${first.title}`;
            } else if (timeText) {
                bodyText = `${timeText} 일정입니다.`;
            } else if (first.title) {
                bodyText = first.title;
            }

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '실버브릿지 일정 알림',
                    body: bodyText,
                    sound: 'default',
                    // data: { id: first.id }
                },
                trigger: null,
            });
        } catch (e) {
            console.log('[AlarmPolling] error:', e?.response || e?.message || e);
        }
    };

    const startPolling = () => {
        if (intervalRef.current) return;

        handleAlarms();
        intervalRef.current = setInterval(handleAlarms, 60 * 1000);
        console.log('[AlarmPolling] started');
    };

    const stopPolling = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            console.log('[AlarmPolling] stopped');
        }
    };

    useEffect(() => {
        startPolling();

        const sub = AppState.addEventListener('change', (next) => {
            if (appState.current.match(/inactive|background/) && next === 'active') {
                startPolling();
            } else if (next.match(/inactive|background/)) {
                stopPolling();
            }
            appState.current = next;
        });

        return () => {
            stopPolling();
            sub.remove();
        };
    }, []);
}
