import axios from 'axios';
import { getAccessToken } from '../auth/token';

const BASE = (process.env.EXPO_PUBLIC_API_BASE || process.env.API_BASE_URL || '').replace(/\/$/, '');

const api = axios.create({
    baseURL: BASE,
    timeout: 15000,
});

// 토큰 주입
api.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => {
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
