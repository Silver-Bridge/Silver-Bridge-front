// mobile/src/shared/api/user.js
import client from './client';

const prefix = '/users';

// 내 전체 프로필 정보 수정 (예: 이름, region, textsize 등)
export async function updateMe(payload) {
    // payload 예: { name, region, textsize, ... }
    const res = await client.patch(`${prefix}/me`, payload);
    return res?.data;
}

// 글자 크기만 따로 변경하고 싶을 때
export async function updateTextsize(textsize) {
    const res = await client.patch(`${prefix}/me/textsize`, { textsize });
    return res?.data;
}

/**
 * ✅ 현재 비밀번호 검증
 * 백엔드 예시: POST /api/users/me/check-password { password }
 * 200 이면 OK, 4xx면 실패로 간주
 */
export async function verifyPassword(password) {
    const res = await client.post(`${prefix}/me/check-password`, { password });
    return res?.data;
}

/**
 * ✅ 비밀번호 변경
 * 백엔드 예시: PATCH /api/users/me/password { oldPassword, newPassword }
 */
export async function changePassword({ oldPassword, newPassword }) {
    const res = await client.patch(`${prefix}/me/password`, {
        oldPassword,
        newPassword,
    });
    return res?.data;
}


/**
 * ✅ 채팅 글자 크기(라벨) 업데이트
 * 예시: PATCH /api/users/me/textsize { textsize: "크게" }
 *
 * backend에서 textsize만 부분 업데이트 하는 엔드포인트 하나 파 두는게 깔끔함.
 */
export async function updateTextsize({ textsize }) {
    const res = await client.patch(`${prefix}/me/textsize`, { textsize });
    // 서버가 변경된 User 정보를 돌려준다면 res.data로 받을 수 있음
    return res?.data;
}

export async function updateRegion({ region }) {
    // 백엔드 URL에 맞춰서 수정:
    // 예시: PATCH /api/users/me/region { region: "경상도" }
    const res = await client.patch(`${prefix}/me/region`, { region });
    return res?.data;
}