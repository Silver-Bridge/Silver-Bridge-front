// mobile/src/shared/auth/token.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_ACCESS = 'ACCESS_TOKEN';
const KEY_REFRESH = 'REFRESH_TOKEN';
const KEY_USER   = 'USER_INFO';

/**
 * 로그인/회원가입 성공 시 토큰+유저 저장
 * 사용 예:
 *   await setAuth({ accessToken, refreshToken, user });
 */
export async function setAuth({ accessToken, refreshToken, user }) {
    const ops = [];
    if (accessToken) ops.push(AsyncStorage.setItem(KEY_ACCESS, accessToken));
    if (refreshToken) ops.push(AsyncStorage.setItem(KEY_REFRESH, refreshToken));
    if (user) ops.push(AsyncStorage.setItem(KEY_USER, JSON.stringify(user)));
    await Promise.all(ops);
}

export async function getAccessToken() {
    return AsyncStorage.getItem(KEY_ACCESS);
}

export async function getRefreshToken() {
    return AsyncStorage.getItem(KEY_REFRESH);
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

/** 로그아웃 시 전체 정리 */
export async function clearAuth() {
    await AsyncStorage.multiRemove([KEY_ACCESS, KEY_REFRESH, KEY_USER]);
}

/** 간단한 로그인 여부 체크 */
export async function isLoggedIn() {
    const token = await getAccessToken();
    return !!token;
}
