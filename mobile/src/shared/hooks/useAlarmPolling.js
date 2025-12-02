// mobile/src/shared/hooks/useAlarmPolling.js

import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { checkCalendarAlarm } from '../api/calendar';

// 🔹 ISO 문자열 → "오전 10:30" 형태로 변환
function formatKoreanTime(isoString) {
    if (!isoString) return '';

    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
        // 파싱이 안 되면 그냥 원문 리턴
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

    // 알람 발생 처리
    const handleAlarms = async () => {
        try {
            const items = await checkCalendarAlarm();

            if (!Array.isArray(items) || items.length === 0) {
                return; // 알람 없음
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
                // ex) "오전 10:30 · 혈압약 드세요"
                bodyText = `${timeText} · ${first.title}`;
            } else if (timeText) {
                // ex) "오전 10:30 일정입니다."
                bodyText = `${timeText} 일정입니다.`;
            } else if (first.title) {
                // ex) "혈압약 드세요"
                bodyText = first.title;
            }

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '실버브릿지 일정 알림', // 🔹 고정 제목
                    body: bodyText,              // 🔹 시작시간 + 제목
                    sound: 'default',
                    // data: { id: first.id }    // 나중에 탭 시 상세 이동에 사용 가능
                },
                trigger: null, // 폴링 시점에 바로 울리기
            });
        } catch (e) {
            console.log('[AlarmPolling] error:', e?.response || e?.message || e);
        }
    };

    // 인터벌 시작/중지 관리
    const startPolling = () => {
        if (intervalRef.current) return;

        handleAlarms(); // 처음 한 번 즉시
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
