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
