import client from '../api/client';
import { now } from './types';

export const ApiStore = {
    async loadThreads({ cursor } = {}) {
        const { data } = await api.get('/threads', { params: { cursor } });
        return data;
    },

    async loadMessages(threadId, { cursor } = {}) {
        const { data } = await api.get(`/threads/${threadId}/messages`, { params: { cursor } });

        return data;
    },

    async sendMessage(threadId, text) {
        const { data } = await api.post(`/threads/${threadId}/messages`, { text });
        return data;
    },

    async sync(since) {
        const { data } = await api.get('/sync', { params: { since } });
        return data || { threads: [], messages: {}, now: now() };
    },
};
