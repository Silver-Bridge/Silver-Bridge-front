import client from './client';


function getTodayISOSeoul() {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const kst = new Date(utcMs + 9 * 3600000);
    const y = kst.getFullYear();
    const m = String(kst.getMonth() + 1).padStart(2, '0');
    const d = String(kst.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}


function getArrayPayload(data) {
    const arr =
        data?.body ??
        data?.items ??
        data?.schedules ??
        data?.data ??
        data;
    return Array.isArray(arr) ? arr : [];
}

function pick(obj, ...cands) {
    for (const k of cands) {
        if (obj[k] != null) return obj[k];
    }
    return undefined;
}

// 오늘 일정 조회
export async function getTodayScheduleApi(userId) {
    if (!userId) return [];
    const dateISO = getTodayISOSeoul();

    const res = await client.get(`/calendar/${userId}/schedules`, {
        params: { date: dateISO },
    });

    try {
        console.log('[HOME RAW DATA]', JSON.stringify(res?.data)?.slice(0, 3000));
    } catch {}

    const raw = getArrayPayload(res?.data);

    if (raw?.[0]) {
        try {
            console.log('[HOME RAW KEYS]', Object.keys(raw[0]));
        } catch {}
    }

    const mapped = raw.map((it, idx) => {
        const id = pick(it, 'id', 'scheduleId', 'sid') ?? idx;

        const title = pick(it, 'title', 'category', 'type', 'subject', 'name', 'summary') ?? '일정';
        const desc  = pick(it, 'description', 'memo', 'content', 'details', 'note');

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

export const getAssistantSuggestionsApi = async () => {
    return [];
};
