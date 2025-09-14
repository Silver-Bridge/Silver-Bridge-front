import axios from 'axios';

export const api = axios.create({
    baseURL: 'https://example.com/api',
    timeout: 10000,
});

api.interceptors.request.use((config) => {
    // 토큰 주입 등
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        // 공통 에러 처리
        return Promise.reject(err);
    }
);
