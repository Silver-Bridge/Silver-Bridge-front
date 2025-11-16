import client from './client';

// ✅ UTC+9(KST) 안전 날짜
function getTodayISOSeoul() {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const kst = new Date(utcMs + 9 * 3600000);
    const y = kst.getFullYear();
    const m = String(kst.getMonth() + 1).padStart(2, '0');
    const d = String(kst.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// ✅ 응답 배열 꺼내기: body / items / schedules / data / 배열 자체
function getArrayPayload(data) {
    const arr =
        data?.body ??
        data?.items ??
        data?.schedules ??
        data?.data ??
        data;
    return Array.isArray(arr) ? arr : [];
}

// ✅ 키가 제각각일 수 있으니 후보를 넓게 잡자
function pick(obj, ...cands) {
    for (const k of cands) {
        if (obj[k] != null) return obj[k];
    }
    return undefined;
}

/**
 * 오늘 일정 조회(초간단 모드):
 * - 오늘 한 번만 호출
 * - 필터/내일 호출 없음
 * - 응답 원본 로그로 키를 파악
 */
export async function getTodayScheduleApi(userId) {
    if (!userId) return [];
    const dateISO = getTodayISOSeoul();

    const res = await client.get(`/calendar/${userId}/schedules`, {
        params: { date: dateISO },
    });

    // 🔍 원본을 크게 한 번 찍어 실제 키 확인
    try {
        console.log('[HOME RAW DATA]', JSON.stringify(res?.data)?.slice(0, 3000));
    } catch {}

    const raw = getArrayPayload(res?.data);

    // 🔍 첫 아이템만 키 나열 찍기
    if (raw?.[0]) {
        try {
            console.log('[HOME RAW KEYS]', Object.keys(raw[0]));
        } catch {}
    }

    // ✅ 폭넓은 키 후보로 표준형으로 변환
    const mapped = raw.map((it, idx) => {
        const id = pick(it, 'id', 'scheduleId', 'sid') ?? idx;

        // 제목/설명: DB 덤프 형태를 보면 '병원 진료/회의/MRI 결과 상담/재활 치료 세션' 같은 값이 title일 가능성 ↑
        // '정기 검진/야간 상담 (자정 넘어감)/물리치료 주 1회' 등은 description일 가능성 ↑
        const title = pick(it, 'title', 'category', 'type', 'subject', 'name', 'summary') ?? '일정';
        const desc  = pick(it, 'description', 'memo', 'content', 'details', 'note');

        // 시간 후보: snake/camel 모두 커버
        const start = String(
            pick(
                it,
                'startAt', 'start_at', 'startTime', 'start_time',
                'start', 'begin', 'timeStart', 'scheduleStart', 'from'
            ) ?? ''
        );
        const end = String(
            pick(
                it,
                'endAt', 'end_at', 'endTime', 'end_time',
                'end', 'finish', 'timeEnd', 'scheduleEnd', 'to'
            ) ?? ''
        );

        const place = pick(it, 'location', 'place', 'spot', 'address') ?? '';
        const color = pick(it, 'color', 'badge', 'type') ?? 'black';

        return {
            id,
            title,
            description: desc ?? '',
            start,
            end,
            place,
            color,
            _raw: it, // 디버깅 유지
        };
    });

    console.log('[HOME SCHEDULE]', { userId, dateISO, count: mapped.length });
    return mapped;
}

// 아직 서버 미구현 → 임시 빈배열
export const getAssistantSuggestionsApi = async () => {
    return [];
};
