import AsyncStorage from '@react-native-async-storage/async-storage';
import { now } from './types';

const KEY_THREADS = 'CHAT_THREADS';
const KEY_THREAD = (id) => `CHAT_THREAD_${id}`;
const KEY_LAST_SYNC = 'CHAT_LAST_SYNC_AT';

async function getJSON(key, fallback) {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;

    try {
        const parsed = JSON.parse(raw);
        // 응답에서 'Data' 또는 'data' 키를 정규화
        if (parsed.Data) return parsed.Data;
        if (parsed.data) return parsed.data;
        return parsed;
    } catch (e) {
        console.warn('Error parsing JSON:', e?.message || e);
        return fallback;
    }
}

async function setJSON(key, v) {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(v));
    } catch (e) {
        console.warn('Error saving to AsyncStorage:', e?.message || e);
    }
}

export const LocalStore = {
    async getLastSyncAt() { return (await AsyncStorage.getItem(KEY_LAST_SYNC)) || '0'; },
    async setLastSyncAt(ts) { await AsyncStorage.setItem(KEY_LAST_SYNC, String(ts)); },

    async loadThreads() { return getJSON(KEY_THREADS, []); },
    async saveThreads(list) { return setJSON(KEY_THREADS, list); },

    async ensureThread(id, title = '대화') {
        const list = await this.loadThreads();
        if (!list.find(t => t.id === id)) {
            const meta = { id, title, updatedAt: now(), lastText: '' };
            await this.saveThreads([meta, ...list]);
        }
    },

    async loadMessages(threadId) { return getJSON(KEY_THREAD(threadId), []); }, // 정방향
    async saveMessages(threadId, items) { return setJSON(KEY_THREAD(threadId), items); },

    async appendMessage(threadId, msg) {
        const list = await this.loadMessages(threadId);
        const newList = [...list, msg]; // 오래된→최신
        await this.saveMessages(threadId, newList);

        // threads 메타도 갱신
        const threads = await this.loadThreads();
        const idx = threads.findIndex(t => t.id === threadId);
        const lastText = (msg.text || '').slice(0, 80);
        const meta = idx >= 0 ? { ...threads[idx], updatedAt: msg.createdAt || now(), lastText } :
            { id: threadId, title: '대화', updatedAt: now(), lastText };
        const rest = threads.filter(t => t.id !== threadId);
        await this.saveThreads([meta, ...rest]);
    },

    // tempId → 서버 확정 메시지로 치환
    async replaceTemp(threadId, tempId, confirmed) {
        const list = await this.loadMessages(threadId);
        const newList = list.map(m => (m.tempId === tempId ? { ...confirmed } : m));
        await this.saveMessages(threadId, newList);
    },

    async markError(threadId, tempId) {
        const list = await this.loadMessages(threadId);
        const newList = list.map(m => (m.tempId === tempId ? { ...m, status: 'error' } : m));
        await this.saveMessages(threadId, newList);
    },

    // 서버 delta를 로컬에 적용(중복 제거 + 정렬)
    async applyDelta(delta) {
        const threads = await this.loadThreads();
        // threads 업데이트(최신순)
        const map = new Map(threads.map(t => [t.id, t]));
        (delta.threads || []).forEach(t => { map.set(t.id, { ...map.get(t.id), ...t }); });
        const mergedThreads = Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
        await this.saveThreads(mergedThreads);

        // 각 스레드 메시지 병합
        const msgByThread = delta.messages || {};
        for (const threadId of Object.keys(msgByThread)) {
            const existing = await this.loadMessages(threadId);   // 정방향
            const incoming = msgByThread[threadId] || [];
            const byId = new Map();
            [...existing, ...incoming].forEach(m => byId.set(m.id || m.tempId, m));
            const merged = Array.from(byId.values()).sort((a, b) => a.createdAt - b.createdAt);
            await this.saveMessages(threadId, merged);
        }
    },
};
