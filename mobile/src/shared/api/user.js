// mobile/src/shared/api/user.js
import client from './client';

const USER_PREFIX = '/users';
const MYPAGE_PREFIX = '/mypage';

export async function updateMe(payload) {
    const res = await client.patch(`${USER_PREFIX}/me`, payload);
    return res?.data;
}

// 채팅 글자 크기 업데이트

export async function updateTextsize(textsize) {
    const res = await client.patch(`${MYPAGE_PREFIX}/member/text-size`, {
        textsize,
    });
    return res?.data;
}

// 지역 업데이트
export async function updateRegion(region) {
    const res = await client.patch(`${MYPAGE_PREFIX}/member/region`, {
        region,
    });
    return res?.data;
}

// 현재 비밀번호 검증
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

// 알람 ON/OFF
export async function updateAlarm(alarmActive) {
    const res = await client.patch(`${MYPAGE_PREFIX}/alarm`, {
        alarmActive,
    });
    return res?.data;
}
