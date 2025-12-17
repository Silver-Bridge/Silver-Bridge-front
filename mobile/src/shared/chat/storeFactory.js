import { LocalStore } from './localStore';
import { ApiStore } from './apiStore';

const USE_SERVER = process.env.EXPO_PUBLIC_USE_SERVER === 'true';

const store = {
    async loadThreads() {
        const local = await LocalStore.loadThreads();
        if (!USE_SERVER) return { items: local, next: null };

        // 서버 목록 불러와 로컬에 반영(선택)
        const remote = await ApiStore.loadThreads();
        await LocalStore.applyDelta({ threads: remote.items, messages: {}, now: Date.now() });
        return remote;
    },

    async loadMessages(threadId, cursor) {
        const local = await LocalStore.loadMessages(threadId);
        if (!USE_SERVER) return { items: local, next: null };
        const remote = await ApiStore.loadMessages(threadId, { cursor });
        await LocalStore.applyDelta({ threads: [], messages: { [threadId]: remote.items }, now: Date.now() });
        return remote;
    },

    async sendMessage(threadId, text) {
        if (!USE_SERVER) {
            return {
                id: 'local-' + Date.now(),
                threadId,
                role: 'me',
                text,
                createdAt: Date.now(),
                status: 'sent',
            };
        }
        return ApiStore.sendMessage(threadId, text);
    },

    async sync() {
        if (!USE_SERVER) return;
        const since = await LocalStore.getLastSyncAt();
        const delta = await ApiStore.sync(since);
        await LocalStore.applyDelta(delta);
        await LocalStore.setLastSyncAt(delta.now || Date.now());
    },

    local: LocalStore,
};

export default store;
