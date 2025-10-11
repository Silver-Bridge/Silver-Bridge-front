import client from '../api/client';
import { now } from './types';

export const ApiStore = {
    async loadThreads({ cursor } = {}) {
        // 예시: GET /threads?cursor=...
        const { data } = await api.get('/threads', { params: { cursor } });
        // data: { items: ThreadMeta[], next?: string }
        return data;
    },

    async loadMessages(threadId, { cursor } = {}) {
        // 예시: GET /threads/:id/messages?cursor=...
        const { data } = await api.get(`/threads/${threadId}/messages`, { params: { cursor } });
        // data: { items: Message[], next?: string }
        return data;
    },

    async sendMessage(threadId, text) {
        // 예시: POST /threads/:id/messages
        const { data } = await api.post(`/threads/${threadId}/messages`, { text });
        // data: Message (서버 확정 id/createdAt 포함)
        return data;
    },

    async sync(since) {
        // 예시: GET /sync?since=<ts>
        const { data } = await api.get('/sync', { params: { since } });
        // data: { threads:[], messages:{ [threadId]: Message[] }, now: number }
        // 엔드포인트 준비 전이면 일단 빈 델타 반환
        return data || { threads: [], messages: {}, now: now() };
    },
};
