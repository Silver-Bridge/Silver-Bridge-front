import axios from 'axios';

export const api = axios.create({
    baseURL: 'https://example.com/api',
    timeout: 10000,
});

api.interceptors.request.use((config) => {
    // 예를 들어, 토큰을 헤더에 넣는 등의 처리를 여기에 추가
    // config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => {
        // 응답에서 'Data'와 'data' 키를 모두 처리하도록 정규화
        if (res.data) {
            return res.data; // res.data가 존재하면 그대로 반환
        }
        if (res.Data) {
            return res.Data; // res.Data가 존재하면 그것을 반환
        }
        return res; // 둘 다 없으면 그대로 반환
    },
    (err) => {
        // 공통 에러 처리
        console.error('API Error:', err);
        return Promise.reject(err);
    }
);
