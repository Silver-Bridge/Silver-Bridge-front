// mobile/src/shared/api/auth.js
import client from './client';

// ✅ API_BASE_URL이 이미 "/api" 또는 "/api/v1" 까지 포함한다고 가정
//    예: API_BASE_URL=http://10.0.2.2:8080/api/v1
const prefix = '/users';

// 회원가입
export async function join(payload) {
    // payload: { name, phoneNumber, password, regionId(or region), userType?... }
    const res = await client.post(`${prefix}/join`, payload);
    return typeof res?.data === 'string' ? res.data : res?.data;
}

// 로그인 (헤더에서 토큰 추출)
export async function login({ phoneNumber, password }) {
    // transformResponse는 굳이 필요 없습니다. headers는 항상 접근 가능해요.
    const res = await client.post(`${prefix}/login`, { phoneNumber, password });

    const h = res?.headers || {};
    const authHeader = h['authorization'] || h['Authorization'];
    const refresh = h['refresh-token'] || h['Refresh-Token'];
    const access = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    return {
        message: typeof res?.data === 'string' ? res.data : '로그인 성공',
        tokens: { accessToken: access, refreshToken: refresh },
    };
}

// 로그아웃
export async function logout({ refreshToken }) {
    const res = await client.post(`${prefix}/logout`, { refreshToken });
    return typeof res?.data === 'string' ? res.data : res?.data;
}

// 인증번호 발송:  /sms/send?phoneNumber=010-1234-5678
export async function sendCodeApi(phoneNumber) {
    const res = await client.post('/sms/send', null, { params: { phoneNumber } });
    return typeof res?.data === 'string' ? res.data : res?.data;
}

// 인증번호 확인:  /sms/verify?phoneNumber=...&code=123456
export async function verifyCodeApi({ phoneNumber, code }) {
    const res = await client.post('/sms/verify', null, { params: { phoneNumber, code } });
    return typeof res?.data === 'string' ? res.data : res?.data;
}
