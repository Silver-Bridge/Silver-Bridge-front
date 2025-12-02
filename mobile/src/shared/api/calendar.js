// mobile/src/shared/api/calendar.js
import client from './client';

const prefix = '/calendar';   // baseURL이 /api 이므로 => /api/calendar...

// 🔧 LocalDateTime에 맞게 문자열 끝의 타임존/오프셋 제거
function toLocalDateTimeString(str) {
    if (!str) return str;
    // 예: "2025-11-25T22:30:00+09:00" -> "2025-11-25T22:30:00"
    //     "2025-11-25T22:30:00Z"      -> "2025-11-25T22:30:00"
    return str.replace(/([+-]\d{2}:?\d{2}|Z)$/,'');
}

/**
 * 1) 특정 월의 일정이 있는 날짜 목록 조회
 *
 * GET /api/calendar?year=2025&month=11
 */
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

/**
 * 2) 특정 날짜의 상세 일정 목록 조회
 *
 * GET /api/calendar/schedules?date=2025-11-12
 */
export async function getSchedulesByDateApi({ date }) {
    const res = await client.get(`${prefix}/schedules`, {
        params: { date },
    });

    const list = res?.data?.body;
    return Array.isArray(list) ? list : [];
}

/**
 * 3) 일정 추가
 *
 * POST /api/calendar/add
 *
 * body: {
 *   "title": "...",
 *   "description": "...",
 *   "start_at": "2025-11-25T22:30:00",
 *   "end_at":   "2025-11-25T23:30:00",
 *   ...
 * }
 */
export async function createScheduleApi({ payload }) {
    const data = {
        ...payload,
        start_at: toLocalDateTimeString(payload.start_at),
        end_at: toLocalDateTimeString(payload.end_at),
    };

    const res = await client.post(`${prefix}/add`, data);
    return res?.data;
}

/**
 * 4) 일정 수정
 *
 * PUT /api/calendar/schedule/{scheduleId}
 */
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

/**
 * 5) 일정 삭제
 *
 * DELETE /api/calendar/schedule/{scheduleId}
 */
export async function deleteScheduleApi({ scheduleId }) {
    const res = await client.delete(`${prefix}/schedule/${scheduleId}`);
    return res?.data;
}

/**
 * 6) 알람 체크
 *
 * GET /api/calendar/alarm/check
 */
export async function checkCalendarAlarm() {
    const res = await client.get(`${prefix}/alarm/check`);
    // 백엔드가 { body: [...] } 형태로 준다고 가정
    return res?.data?.body || [];
}
