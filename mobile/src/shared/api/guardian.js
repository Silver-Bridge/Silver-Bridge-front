// mobile/src/shared/api/guardian.js
import client from './client';

/**
 * 보호자/노인 공통: 오늘 최다 감정 1개
 * GET /api/emotions/today/top
 */
export async function getTodayTopEmotion() {
    const res = await client.get('/emotions/today/top');
    return res.data;
}

/**
 * 최근 1주 감정 요약
 * GET /api/emotions/weekly/last
 */
export async function getLastWeekEmotionSummary() {
    const res = await client.get('/emotions/weekly/last');
    return res.data;
}

/**
 * 이번 달 감정 요약
 * GET /api/emotions/month/current
 *
 * 백엔드 컨트롤러가 year/month 안 받으면
 * params 없이 호출하면 되고,
 * 지금 컨트롤러는 현재 월 기준이니
 * 일단 쿼리 안 넘기는 버전으로 두는 게 자연스러움.
 */
export async function getEmotionSummaryCurrentMonth() {
    const res = await client.get('/emotions/month/current');
    return res.data;
}

/**
 * 지난 달 감정 요약
 * GET /api/emotions/month/previous
 */
export async function getEmotionSummaryPreviousMonth() {
    const res = await client.get('/emotions/month/previous');
    return res.data;
}

/**
 * 🔥 보호자 - 노인 연결
 * POST /api/mypage/nok/connect
 * body: { elderPhone: "010-1234-5678" }
 */
export async function connectElderApi(elderPhone) {
    const res = await client.post('/mypage/nok/connect', {
        elderPhone,
    });
    return res.data; // { message: "노인과 성공적으로 연결되었습니다." } 예상
}


/**
 * 🔹 보호자 홈: 오늘(오늘 날짜)의 '보호 대상자' 일정 목록
 * GET /api/calendar/schedules?date=YYYY-MM-DD
 *
 * CalendarController 에서 authentication 기반으로
 * elderAccessService.getAccessibleElderId(...) 를 쓰기 때문에
 * 보호자로 로그인해도 자동으로 연결된 노인의 일정이 내려옴.
 */
export async function getGuardianTodayScheduleApi() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const res = await client.get('/calendar/schedules', {
        params: { date: dateStr },
    });

    // 백엔드에서 ScheduleListResponse { body: [...] } 구조라면 body 우선
    return res.data?.body ?? res.data ?? [];
}

/**
 * 🔹 특정 월의 일정 유무 조회
 * GET /api/calendar?year=YYYY&month=MM
 *
 * 백엔드에서 Authentication + ElderAccessService 로
 * 보호자 / 노인 모두 알아서 elderId를 결정해 줌.
 */
export async function getCalendarDatesApi({ year, month }) {
    const res = await client.get('/calendar', {
        params: { year, month },
    });

    // CalendarDateListResponse { body: [...] } 구조 기준
    return res.data?.body ?? res.data ?? [];
}

/**
 * 🔹 특정 날짜의 일정 목록
 * GET /api/calendar/schedules?date=YYYY-MM-DD
 */
export async function getSchedulesByDateApi({ date }) {
    const res = await client.get('/calendar/schedules', {
        params: { date },
    });

    // ScheduleListResponse { body: [...] } 구조 기준
    return res.data?.body ?? res.data ?? [];
}

// 🔹 보호자 → 연결된 노인 정보 조회
// GET /api/mypage/nok/elder-info
export async function getElderInfoApi() {
    const res = await client.get('/mypage/nok/elder-info');
    return res.data; // { elderId, elderName, elderPhone, message? }
}

// 🔹 노인 → 연결된 보호자 정보 조회
// GET /api/mypage/member/guardian-info
export async function getGuardianInfoApi() {
    const res = await client.get('/mypage/member/guardian-info');
    return res.data; // { guardianId, guardianName, guardianPhone }
}