// mobile/src/shared/api/calendar.js
import client from './client';

const prefix = '/calendar';   // baseURL이 /api 이므로 => /api/calendar...

/**
 * 1) 특정 월의 일정이 있는 날짜 목록 조회
 *
 * GET /api/calendar?year=2025&month=11
 *
 * 백엔드 응답:
 * {
 *   "body": [
 *     { "date": "2025-11-12" },
 *     { "date": "2025-11-18" },
 *     ...
 *   ]
 * }
 *
 * ⚠️ userId 필요 없음 (Authentication 기반 elderId 자동 결정)
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
 *       ...
 *     },
 *     ...
 *   ]
 * }
 *
 * ⚠️ userId 필요 없음 (Authentication 기반 elderId 자동 결정)
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
 *   "start_at": "...",
 *   "end_at": "...",
 *   ...
 * }
 *
 * ⚠️ userId 필요 없음
 */
export async function createScheduleApi({ payload }) {
    const res = await client.post(`${prefix}/add`, payload);
    return res?.data;
}

/**
 * 4) 일정 수정
 *
 * PUT /api/calendar/schedule/{scheduleId}
 *
 * ⚠️ userId 필요 없음
 */
export async function updateScheduleApi({ scheduleId, payload }) {
    const res = await client.put(
        `${prefix}/schedule/${scheduleId}`,
        payload,
    );
    return res?.data;
}

/**
 * 5) 일정 삭제
 *
 * DELETE /api/calendar/schedule/{scheduleId}
 *
 * ⚠️ userId 필요 없음
 */
export async function deleteScheduleApi({ scheduleId }) {
    const res = await client.delete(`${prefix}/schedule/${scheduleId}`);
    return res?.data;
}
