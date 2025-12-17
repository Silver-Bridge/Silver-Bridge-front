// mobile/src/shared/api/calendar.js
import client from './client';

const prefix = '/calendar';

function toLocalDateTimeString(str) {
    if (!str) return str;
    return str.replace(/([+-]\d{2}:?\d{2}|Z)$/,'');
}


//특정 월의 일정이 있는 날짜 목록 조회
export async function getCalendarDatesApi({ year, month }) {
    const res = await client.get(prefix, {
        params: { year, month },
    });

    const list = res?.data?.body;
    if (!Array.isArray(list)) return [];

    // "2025-11-12" 형식의 문자열 배열만 리턴
    return list
        .map((item) => item?.date)
        .filter(Boolean);
}

// 특정 날짜의 상세 일정 목록 조회
export async function getSchedulesByDateApi({ date }) {
    const res = await client.get(`${prefix}/schedules`, {
        params: { date },
    });

    const list = res?.data?.body;
    return Array.isArray(list) ? list : [];
}

// 일정 추가
export async function createScheduleApi({ payload }) {
    const data = {
        ...payload,
        start_at: toLocalDateTimeString(payload.start_at),
        end_at: toLocalDateTimeString(payload.end_at),
    };

    const res = await client.post(`${prefix}/add`, data);
    return res?.data;
}

//일정 수정
export async function updateScheduleApi({ scheduleId, payload }) {
    const data = {
        ...payload,
        start_at: toLocalDateTimeString(payload.start_at),
        end_at: toLocalDateTimeString(payload.end_at),
    };

    const res = await client.put(
        `${prefix}/schedule/${scheduleId}`,
        data,
    );
    return res?.data;
}

// 일정 삭제
export async function deleteScheduleApi({ scheduleId }) {
    const res = await client.delete(`${prefix}/schedule/${scheduleId}`);
    return res?.data;
}

// 알람 체크
export async function checkCalendarAlarm() {
    const res = await client.get(`${prefix}/alarm/check`);
    return res?.data?.body || [];
}
