// mobile/src/shared/api/calendar.js
import client from './client';

const prefix = '/calendar';   // baseURL이 /api 이므로 => /api/calendar/...

/**
 * 1) 특정 월의 일정이 있는 날짜 목록 조회
 * GET /api/calendar/{userId}?year=2025&month=11
 *
 * 백엔드 응답:
 * {
 *   "body": [
 *     { "date": "2025-11-12" },
 *     { "date": "2025-11-18" },
 *     ...
 *   ]
 * }
 */
export async function getCalendarDatesApi({ userId, year, month }) {
    const res = await client.get(`${prefix}/${userId}`, {
        params: { year, month },
    });

    const list = res?.data?.body;
    if (!Array.isArray(list)) return [];

    // CalendarScreen은 "2025-11-12" 형식의 문자열 배열만 필요하므로 date만 추출
    return list
        .map((item) => item?.date)
        .filter(Boolean);
}

/**
 * 2) 특정 날짜의 상세 일정 목록 조회
 * GET /api/calendar/{userId}/schedules?date=2025-11-12
 *
 * 백엔드 응답:
 * {
 *   "body": [
 *     {
 *       "id": 1,
 *       "title": "...",
 *       "description": "...",
 *       "start_at": "...",
 *       "end_at": "...",
 *       "alarm_time": "2025-11-12T14:00:00+09:00",
 *       ...
 *     },
 *     ...
 *   ]
 * }
 */
export async function getSchedulesByDateApi({ userId, date }) {
    const res = await client.get(`${prefix}/${userId}/schedules`, {
        params: { date },
    });

    const list = res?.data?.body;
    return Array.isArray(list) ? list : [];
}

/**
 * 3) 일정 추가
 * POST /api/calendar/{userId}/add
 */
export async function createScheduleApi({ userId, payload }) {
    const res = await client.post(`${prefix}/${userId}/add`, payload);
    return res?.data;
}

/**
 * 4) 일정 수정
 * PUT /api/calendar/{userId}/schedule/{scheduleId}
 */
export async function updateScheduleApi({ userId, scheduleId, payload }) {
    const res = await client.put(
        `${prefix}/${userId}/schedule/${scheduleId}`,
        payload,
    );
    return res?.data;
}

/**
 * 5) 일정 삭제
 * DELETE /api/calendar/{userId}/schedule/{scheduleId}
 */
export async function deleteScheduleApi({ userId, scheduleId }) {
    const res = await client.delete(`${prefix}/${userId}/schedule/${scheduleId}`);
    return res?.data;
}
