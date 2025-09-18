import MockAdapter from 'axios-mock-adapter';
import client from '../api/client';
import { USE_MOCK } from '@env';
import todos from './data/todos.json';

const DELAY_MS = 400;

export function setupMock() {
    if (USE_MOCK !== 'true') return; // .env에서 USE_MOCK=false면 바로 패스

    const mock = new MockAdapter(client, {delayResponse: DELAY_MS});

    // 로그인 (이메일/비번 있으면 성공)
    mock.onPost('/auth/login').reply((config) => {
        const body = JSON.parse(config.data || '{}');
        if (body.email && body.password) {
            return [200, {accessToken: 'mock-token-123', user: {id: 1, name: 'Mock User'}}];
        }
        return [401, {message: 'Invalid credentials'}];
    });

}
