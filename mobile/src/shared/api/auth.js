// mobile/src/shared/api/auth.js
import client from './client';
import { setAuth, setUser, normalizeUser, parseJwt } from '../auth/token';

const prefix = '/users';

export async function getMe() {
    const res = await client.get(`${prefix}/me`);
    return res?.data;
}

export async function login({ phoneNumber, password }) {
    const res = await client.post(`${prefix}/login`, { phoneNumber, password });

    const h = res?.headers || {};
    const authHeader = h['authorization'] || h['Authorization'];
    const refresh = h['refresh-token'] || h['Refresh-Token'];
    const access = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    // 토큰 저장
    await setAuth({ accessToken: access, refreshToken: refresh });

    // 유저 저장
    let user = res?.data?.user;

    if (!user) {
        try {
            user = await getMe();
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

// 카카오 소셜 로그인
export async function kakaoSocialLogin(kakaoAccessToken) {
    const res = await client.post(
        `${prefix}/social/kakao`,
        null,
        {
            params: { accessToken: kakaoAccessToken },
        },
    );

    const data = res?.data || {};


    const access =
        data.accessToken ??
        data.token?.accessToken ??
        null;

    const refresh =
        data.refreshToken ??
        data.token?.refreshToken ??
        null;

    if (!access) {
        throw new Error('서버에서 accessToken을 받지 못했습니다.');
    }

    const claims = parseJwt(access);
    console.log('[KAKAO JWT CLAIMS]', claims);

    const aud = claims?.aud;


    if (aud === 'temp-user') {
        console.log('[KAKAO LOGIN] new user, tempToken =', access);


        return {
            mode: 'NEW',
            registered: false,
            tempToken: access,
        };
    }


    if (aud === 'access') {
        if (!refresh) {
            throw new Error('기존 회원인데 refreshToken이 없습니다.');
        }

        // 토큰 저장
        await setAuth({ accessToken: access, refreshToken: refresh });

        // 유저 정보 저장
        let user;
        try {
            user = await getMe();
        } catch (e) {
            user = {
                id: claims.id ?? claims.userId ?? claims.uid ?? claims.sub,
                name: claims.nickname ?? claims.name ?? '사용자',
                phoneNumber: claims.phoneNumber ?? null,
                role: claims.role || claims.auth,
            };
        }

        const normalized = normalizeUser(user);
        await setUser(normalized);

        console.log('[KAKAO LOGIN] existing USER_INFO =', normalized);

        return {
            mode: 'EXISTING',
            registered: true,
            tokens: { accessToken: access, refreshToken: refresh },
            user: normalized,
        };
    }

    console.warn('[KAKAO LOGIN] 알 수 없는 aud 값:', aud);
    throw new Error('유효하지 않은 카카오 로그인 토큰입니다.');
}

export async function completeSocialRegister(tempToken, payload) {
    const res = await client.post(
        `${prefix}/social/register-final`,
        payload,
        {
            headers: {
                Authorization: `Bearer ${tempToken}`,
            },
        },
    );

    const h = res?.headers || {};
    const authHeader = h['authorization'] || h['Authorization'];
    const refresh = h['refresh-token'] || h['Refresh-Token'];
    const access = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : undefined;

    // 정식 토큰 저장
    await setAuth({ accessToken: access, refreshToken: refresh });

    // 유저 정보 가져오기
    let user;
    try {
        user = await getMe();
    } catch (e) {
        if (access && access.split('.').length === 3) {
            const c = parseJwt(access);
            user = {
                id: c.id ?? c.userId ?? c.uid ?? c.sub,
                name: c.name ?? '사용자',
                phoneNumber: c.phoneNumber ?? null,
            };
        } else {
            user = { name: '사용자' };
        }
    }

    await setUser(normalizeUser(user));

    return {
        tokens: { accessToken: access, refreshToken: refresh },
        user,
    };
}

