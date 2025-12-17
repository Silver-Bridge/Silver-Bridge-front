// mobile/src/shared/api/guardian.js
import client from './client';


//보호자/노인 공통: 오늘 최다 감정 1개
export async function getTodayTopEmotion() {
    const res = await client.get('/emotions/today/top');
    return res.data;
}

// 최근 1주 감정 요약
export async function getLastWeekEmotionSummary() {
    const res = await client.get('/emotions/weekly/last');
    return res.data;
}

// 이번 달 감정 요약
export async function getEmotionSummaryCurrentMonth() {
    const res = await client.get('/emotions/month/current');
    return res.data;
}

// 지난 달 감정 요약
export async function getEmotionSummaryPreviousMonth() {
    const res = await client.get('/emotions/month/previous');
    return res.data;
}

// 보호자 - 노인 연결
export async function connectElderApi(elderPhone) {
    const res = await client.post('/mypage/nok/connect', {
        elderPhone,
    });
    return res.data;
}


//오늘 '보호 대상자' 일정 목록
export async function getGuardianTodayScheduleApi() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const res = await client.get('/calendar/schedules', {
        params: { date: dateStr },
    });
    return res.data?.body ?? res.data ?? [];
}

// 특정 월의 일정 유무 조회
export async function getCalendarDatesApi({ year, month }) {
    const res = await client.get('/calendar', {
        params: { year, month },
    });

    return res.data?.body ?? res.data ?? [];
}

// 특정 날짜의 일정 목록
export async function getSchedulesByDateApi({ date }) {
    const res = await client.get('/calendar/schedules', {
        params: { date },
    });

    return res.data?.body ?? res.data ?? [];
}

//보호자 → 연결된 노인 정보 조회
export async function getElderInfoApi() {
    const res = await client.get('/mypage/nok/elder-info');
    return res.data;
}

// 노인 → 연결된 보호자 정보 조회

export async function getGuardianInfoApi() {
    const res = await client.get('/mypage/member/guardian-info');
    return res.data;
}