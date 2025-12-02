// mobile/src/shared/api/user.js
import client from './client';

const USER_PREFIX = '/users';
const MYPAGE_PREFIX = '/mypage';

// ✅ (선택) 내 전체 프로필 수정 (/api/users/me)
export async function updateMe(payload) {
    const res = await client.patch(`${USER_PREFIX}/me`, payload);
    return res?.data;
}

/**
 * ✅ 채팅 글자 크기 업데이트
 * backend: PATCH /api/mypage/member/text-size { textsize: "보통" }
 */
export async function updateTextsize(textsize) {
    const res = await client.patch(`${MYPAGE_PREFIX}/member/text-size`, {
        textsize,
    });
    return res?.data;
}

/**
 * ✅ 지역 업데이트
 * backend: PATCH /api/mypage/member/region { region: "경상도" }
 */
export async function updateRegion(region) {
    const res = await client.patch(`${MYPAGE_PREFIX}/member/region`, {
        region,
    });
    return res?.data;
}

/**
 * ✅ 현재 비밀번호 검증
 * backend 예시: POST /api/users/me/check-password { password }
 */
export async function verifyPassword(password) {
    const res = await client.post(`${USER_PREFIX}/me/check-password`, {
        password,
    });
    return res?.data;
}


export async function changePassword({ currentPassword, newPassword }) {
    const res = await client.patch(`${MYPAGE_PREFIX}/password-update`, {
        currentPassword,
        newPassword,
    });
    return res?.data;
}

/**
 * ✅ 알람 ON/OFF
 * backend: PATCH /api/mypage/alarm { alarmActive: true/false }
 */
export async function updateAlarm(alarmActive) {
    const res = await client.patch(`${MYPAGE_PREFIX}/alarm`, {
        alarmActive,
    });
    return res?.data;
}
