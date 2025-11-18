// mobile/src/shared/api/auth.js
import client from './client';
import { setAuth, setUser, normalizeUser, parseJwt } from '../auth/token';

const prefix = '/users';

export async function getMe() {
    const res = await client.get(`${prefix}/me`); // 서버에서 사용자 프로필 반환
    return res?.data;
}

export async function login({ phoneNumber, password }) {
    const res = await client.post(`${prefix}/login`, { phoneNumber, password });

    const h = res?.headers || {};
    const authHeader = h['authorization'] || h['Authorization'];
    const refresh = h['refresh-token'] || h['Refresh-Token'];
    const access = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    // 1) 토큰 저장
    await setAuth({ accessToken: access, refreshToken: refresh });

    // 2) 유저 저장: 응답 user → /users/me → 토큰 클레임
    let user = res?.data?.user;

    if (!user) {
        try {
            user = await getMe();              // ★ 여기서 DB의 이름(서범주) 획득
        } catch (e) {
            if (access && access.split('.').length === 3) {
                const c = parseJwt(access);
                user = {
                    id: c.id ?? c.userId ?? c.uid ?? c.sub,
                    name: c.name ?? '사용자',
                    phoneNumber,
                };
            } else {
                user = { name: '사용자', phoneNumber };
            }
        }
    }

    await setUser(normalizeUser(user));
    console.log('[LOGIN] saved USER_INFO =', normalizeUser(user));

    return {
        message: typeof res?.data === 'string' ? res.data : '로그인 성공',
        tokens: { accessToken: access, refreshToken: refresh },
        user,
    };
}
// 회원가입
export async function join(payload) {
    // payload: { name, phoneNumber, password, regionId(or region), userType?... }
    const res = await client.post(`${prefix}/join`, payload);
    return typeof res?.data === 'string' ? res.data : res?.data;
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

export async function kakaoSocialLogin(kakaoAccessToken) {
    const res = await client.post(`${prefix}/social/kakao`, null, {
        params: { accessToken: kakaoAccessToken }, // @RequestParam("accessToken")
    });

    const body = res?.data || {};
    const access = body.accessToken;
    const refresh = body.refreshToken;
    const grantType = body.grantType || 'Bearer';

    if (!access) {
        throw new Error('카카오 로그인 응답에 accessToken이 없습니다.');
    }

    await setAuth({ accessToken: access, refreshToken: refresh, grantType });

    let user;
    try {
        user = await getMe();
    } catch (e) {
        if (access && access.split('.').length === 3) {
            const c = parseJwt(access);
            user = {
                id: c.id ?? c.userId ?? c.uid ?? c.sub,
                name: c.name ?? c.nickname ?? '카카오 사용자',
            };
        } else {
            user = { name: '카카오 사용자' };
        }
    }

    await setUser(normalizeUser(user));

    return {
        message: '카카오 로그인 성공',
        tokens: { accessToken: access, refreshToken: refresh },
        user,
    };
}