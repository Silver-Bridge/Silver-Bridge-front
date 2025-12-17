import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_ACCESS = 'ACCESS_TOKEN';
const KEY_REFRESH = 'REFRESH_TOKEN';
const KEY_USER   = 'USER_INFO';

const BAD = new Set([null, undefined, '', 'null', 'undefined']);

export async function setAuth({ accessToken, refreshToken, user }) {
    const ops = [];
    if (!BAD.has(accessToken)) ops.push(AsyncStorage.setItem(KEY_ACCESS, accessToken));
    if (!BAD.has(refreshToken)) ops.push(AsyncStorage.setItem(KEY_REFRESH, refreshToken));
    if (user) ops.push(AsyncStorage.setItem(KEY_USER, JSON.stringify(user)));
    if (ops.length) await Promise.all(ops);
}

export async function getAccessToken() {
    const t = await AsyncStorage.getItem(KEY_ACCESS);
    return BAD.has(t) ? null : t;
}

export async function getRefreshToken() {
    const t = await AsyncStorage.getItem(KEY_REFRESH);
    return BAD.has(t) ? null : t;
}

export async function clearAuth() {
    await AsyncStorage.multiRemove([KEY_ACCESS, KEY_REFRESH, KEY_USER]);
}

export async function getUser() {
    const raw = await AsyncStorage.getItem(KEY_USER);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

export async function setUser(user) {
    if (!user) { await AsyncStorage.removeItem(KEY_USER); return; }
    await AsyncStorage.setItem(KEY_USER, JSON.stringify(user));
}


export function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        );
        return JSON.parse(json);
    } catch { return {}; }
}

export function normalizeUser(u) {
    if (!u) return null;
    return {
        id: u.id ?? u.userId ?? u.uid ?? u.sub,
        name: u.name ?? u.username ?? '',
        phoneNumber: u.phoneNumber ?? u.phone ?? '',
        ...u,
    };
}

export async function getUserId() {
    const u = await getUser();
    return u?.id ?? u?.userId ?? u?.uid ?? u?.sub ?? null;
}

export async function ensureUserFromToken() {
    const raw = await AsyncStorage.getItem(KEY_USER);
    let user = raw ? JSON.parse(raw) : null;

    if (!user?.id) {
        const at = await getAccessToken();
        if (at && at.split('.').length === 3) {
            const claims = parseJwt(at);
            user = normalizeUser({ ...(user ?? {}), ...claims });
            if (user?.id) {
                await AsyncStorage.setItem(KEY_USER, JSON.stringify(user));
            }
        }
    }
    return user;
}
