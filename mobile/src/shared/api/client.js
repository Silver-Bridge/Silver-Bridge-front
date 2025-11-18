import axios from 'axios';
import { API_BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAccessToken, setAuth } from '../auth/token';

// 인증 불필요(Authorization 금지) 경로 화이트리스트
const AUTH_WHITELIST = [
    '/users/login',
    '/users/join',
    '/sms/send',
    '/sms/verify',
    '/users/refresh',
];

const isJwt = (t) => {
    if (!t || typeof t !== 'string') return false;
    const parts = t.split('.');
    return parts.length === 3 && parts.every(p => p && /^[A-Za-z0-9\-_]+$/.test(p));
};

// 끝 경로 기준 비교 보조
function extractPath(u) {
    try {
        const s = String(u || '');
        const q = s.split('?')[0];
        const parts = q.split('/');
        return '/' + parts.slice(-2).join('/');
    } catch { return String(u || ''); }
}
function isWhitelisted(pathOrUrl) {
    const p = extractPath(pathOrUrl);
    return AUTH_WHITELIST.some(w => p.endsWith(w));
}

const client = axios.create({
    baseURL: API_BASE_URL?.trim(),   // 예: http://<PC_IP>:8080/api
    timeout: 60000,
});

// 요청: ACCESS_TOKEN 자동 첨부 + 진단 로그
client.interceptors.request.use(async (config) => {
    const access = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (access) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${access}`;
    }
    const full = `${config.baseURL || ''}${config.url || ''}`;
    console.log('[API REQ]', full, config.method, 'Auth? =>', !!access, access ? `Bearer ${access.slice(0,16)}` : undefined, config.params || config.data);
    return config;
});

client.interceptors.response.use(
    (res) => res,
    async (error) => {
        const status = error?.response?.status;
        const msg =
            error?.response?.data?.message ||
            error?.message ||
            '네트워크 오류가 발생했습니다.';
        error.__normalized = { status, message: msg };
        console.log('[API ERROR]', {
            url: `${error?.config?.baseURL||''}${error?.config?.url||''}`,
            method: error?.config?.method,
            status,
            message: msg,
        });
        if (status === 401) {
            await AsyncStorage.multiRemove(['ACCESS_TOKEN', 'REFRESH_TOKEN', 'USER_INFO']);
        }
        return Promise.reject(error);
    }
);


// 에러 표준화 + 401 처리 + 헤더 토큰 갱신 저장
client.interceptors.response.use(
    async (res) => {
        const h = res?.headers || {};
        const authHeader = h['authorization'] || h['Authorization'];
        const refresh = h['refresh-token'] || h['Refresh-Token'];
        const access = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

        const ops = {};
        if (isJwt(access)) ops.accessToken = access;
        if (refresh) ops.refreshToken = refresh;
        if (ops.accessToken || ops.refreshToken) {
            await setAuth(ops);
        }
        return res;
    },
    async (error) => {
        const status = error?.response?.status;
        const msg =
            error?.response?.data?.message ||
            error?.message ||
            '네트워크 오류가 발생했습니다.';
        error.__normalized = { status, message: msg };

        if (status === 401) {
            await AsyncStorage.multiRemove(['ACCESS_TOKEN', 'REFRESH_TOKEN', 'USER_INFO']);
            // TODO: 필요 시 여기서 네비게이션으로 로그인 화면 reset
        }
        return Promise.reject(error);
    }
);

export default client;
