// mobile/src/shared/api/client.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env'; // .env에서 불러옴 (예: http://10.0.2.2:8080/api/v1)

const client = axios.create({
    baseURL: API_BASE_URL?.trim(),
    timeout: 15000,
});

// 요청: ACCESS_TOKEN 자동 첨부
client.interceptors.request.use((config) => {
    console.log('[API REQ]', (config.baseURL||'')+(config.url||''), config.method, config.params);
    return config;
});
client.interceptors.response.use(
    (res) => res,
    (error) => {
        console.log('[API ERROR]', {
            url: `${error?.config?.baseURL||''}${error?.config?.url||''}`,
            method: error?.config?.method,
            status: error?.response?.status,
            message: error?.message,
        });
        return Promise.reject(error);
    }
);

// 응답: 공통 에러 normalize + 401 → 토큰 삭제 후 로그인 화면 유도(선택)
client.interceptors.response.use(
    (res) => res,
    async (error) => {
        const status = error?.response?.status;
        const msg =
            error?.response?.data?.message ||
            error?.message ||
            '네트워크 오류가 발생했습니다.';

        // 에러 객체에 표준화 메시지 부착
        error.__normalized = { status, message: msg };

        if (status === 401) {
            // 토큰 만료/무효 → 정리
            await AsyncStorage.multiRemove(['ACCESS_TOKEN', 'REFRESH_TOKEN', 'USER_INFO']);
            // TODO: 필요 시 여기서 navigationRef.resetTo('Login') 같은 처리
        }
        return Promise.reject(error);
    }
);

export default client;
