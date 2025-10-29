import axios from 'axios';
import { getAccessToken } from '../auth/token';

const BASE = (process.env.EXPO_PUBLIC_API_BASE || process.env.API_BASE_URL || '').replace(/\/$/, '');

const api = axios.create({
    baseURL: BASE,      // 여기선 루트만, 각 모듈에서 /api/users/... 붙일게요
    timeout: 15000,
});

// 토큰 주입 (로그인 전에는 없음)
api.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => {
        // 기본적으로 res.data를 돌려주되, 문자열 응답(회원가입/로그인 메시지)도 그대로 유지
        return res.data !== undefined ? res.data : res;
    },
    (err) => {
        const status = err?.response?.status;
        // 문자열 본문도 message로 정규화
        const raw = err?.response?.data;
        const message = typeof raw === 'string' ? raw : (raw?.message || err.message);
        err.__normalized = {
            status,
            code: raw?.code,
            message,
            details: raw?.errors || null,
        };
        return Promise.reject(err);
    }
);

export default api;
