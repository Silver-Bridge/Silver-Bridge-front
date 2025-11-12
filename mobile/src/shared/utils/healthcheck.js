import { getUser, getAccessToken, getRefreshToken, getUserId } from '../auth/token';
import client from '../api/client';
import { getTodayScheduleApi, getAssistantSuggestionsApi } from '../api/home';

export async function runAppHealthCheck() {
    try {
        const user = await getUser();
        const uid  = await getUserId();
        const at   = await getAccessToken();
        const rt   = await getRefreshToken();

        console.log('[HC] USER_INFO =', user);
        console.log('[HC] USER_ID   =', uid);
        console.log('[HC] ACCESS_T  =', at ? at.slice(0, 12) + '...' : null);
        console.log('[HC] REFRESH_T =', rt ? rt.slice(0, 12) + '...' : null);

        if (!uid) throw new Error('USER_ID 없음 (로그인/저장 로직 확인)');

        // 캘린더/제안 실제 호출
        const sch = await getTodayScheduleApi();
        console.log('[HC] TodaySchedule items =', sch);

        try {
            const sug = await getAssistantSuggestionsApi();
            console.log('[HC] Suggestions =', sug);
        } catch (e) {
            console.log('[HC] Suggestions error =', e?.__normalized || e?.message);
        }

        return true;
    } catch (e) {
        console.log('[HC] FAILED =>', e?.message || e);
        return false;
    }
}
