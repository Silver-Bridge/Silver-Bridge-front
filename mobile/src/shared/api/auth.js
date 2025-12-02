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

/**
 * ✅ 카카오 소셜 로그인 (access_token 기반)
 * 프론트에서 kakaoAccessToken을 받아서 서버로 전달
 */
export async function kakaoSocialLogin(kakaoAccessToken) {
    const res = await client.post(
        `${prefix}/social/kakao`,
        null,
        {
            params: { accessToken: kakaoAccessToken },
        },
    );

    const data = res?.data || {};

    // 🔹 백엔드가 TokenDto 를 그대로 반환한다고 가정
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

    // 🔍 JWT 파싱해서 임시/정식 토큰 구분 (aud 기준)
    const claims = parseJwt(access);
    console.log('[KAKAO JWT CLAIMS]', claims);

    const aud = claims?.aud;

    // =========================
    // 🆕 상황 B: 신규 회원 (임시 토큰: aud = temp-user)
    // =========================
    if (aud === 'temp-user') {
        console.log('[KAKAO LOGIN] new user, tempToken =', access);

        // 👉 여기서는 setAuth / setUser 하지 않음
        //    Signup 화면에서 completeSocialRegister(tempToken, payload) 호출할 때 사용
        return {
            mode: 'NEW',
            registered: false,
            tempToken: access, // 임시 JWT 자체를 tempToken 으로 넘김
        };
    }

    // =========================
    // ✅ 상황 A: 기존 회원 (정식 토큰: aud = access)
    // =========================
    if (aud === 'access') {
        if (!refresh) {
            throw new Error('기존 회원인데 refreshToken이 없습니다.');
        }

        // 1) 토큰 저장
        await setAuth({ accessToken: access, refreshToken: refresh });

        // 2) 유저 정보 저장: /users/me 호출 (실패 시 클레임으로 fallback)
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

    // 그 외 이상한 aud 값 (예방용)
    console.warn('[KAKAO LOGIN] 알 수 없는 aud 값:', aud);
    throw new Error('유효하지 않은 카카오 로그인 토큰입니다.');
}

// 최하단 근처에 추가
export async function completeSocialRegister(tempToken, payload) {
    // tempToken 은 "임시 JWT" (aud = temp-user)
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

