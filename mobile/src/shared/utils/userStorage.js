// /src/shared/utils/userStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_INFO_KEY = 'USER_INFO';
const FONT_SCALE_KEY = 'FONT_SCALE';

// 현재 저장된 사용자 정보 가져오기
export async function getStoredUser() {
    try {
        const raw = await AsyncStorage.getItem(USER_INFO_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        console.log('[userStorage] getStoredUser error', e);
        return null;
    }
}

// USER_INFO 일부만 업데이트 (ex: { textsize: '크게' })
export async function updateStoredUser(patch) {
    try {
        const current = (await getStoredUser()) || {};
        const next = { ...current, ...patch };
        await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(next));
        return next;
    } catch (e) {
        console.log('[userStorage] updateStoredUser error', e);
        throw e;
    }
}

// 글자 크기만 따로 저장/조회
export async function getStoredFontScale() {
    try {
        const v = await AsyncStorage.getItem(FONT_SCALE_KEY);
        if (!v) return null;
        return Number(v);
    } catch (e) {
        console.log('[userStorage] getStoredFontScale err', e);
        return null;
    }
}

export async function setStoredFontScale(scale) {
    try {
        await AsyncStorage.setItem(FONT_SCALE_KEY, String(scale));
    } catch (e) {
        console.log('[userStorage] setStoredFontScale err', e);
    }
}
