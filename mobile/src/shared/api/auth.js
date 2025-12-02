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
    // 백엔드: /users/social/kakao?accessToken=...
    const res = await client.post(
        `${prefix}/social/kakao`,
        null,
        {
            params: { accessToken: kakaoAccessToken },
        },
    );

    const data = res?.data || {};

    // ✔ 상황 A: 기존 회원 (registered = true) → 바로 JWT + 유저 정보 세팅
    if (data.registered) {
        const token = data.token || {};
        const user = data.user || {};

        const access = token.accessToken;
        const refresh = token.refreshToken;

        if (!access || !refresh) {
            throw new Error('서버에서 유효한 토큰을 받지 못했습니다.');
        }

        // 1) 토큰 저장
        await setAuth({ accessToken: access, refreshToken: refresh });

        // 2) 유저 저장
        const normalized = normalizeUser(user);
        await setUser(normalized);

        console.log('[KAKAO LOGIN] existing USER_INFO =', normalized);

        return {
            mode: 'EXISTING',          // 기존 회원
            registered: true,
            tokens: { accessToken: access, refreshToken: refresh },
            user: normalized,
        };
    }

    // ✔ 상황 B: 신규 회원 (registered = false) → tempToken만 받고 추가 회원가입 필요
    const tempToken = data.tempToken;
    if (!tempToken) {
        throw new Error('신규 회원인데 tempToken이 없습니다.');
    }

    console.log('[KAKAO LOGIN] new user, tempToken =', tempToken);

    // 여기서는 아직 setAuth / setUser 안 함
    // → 추가 정보 입력 화면에서 /users/social/register-final 호출 후 최종 로그인 처리
    return {
        mode: 'NEW',             // 신규 회원
        registered: false,
        tempToken,
    };
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

