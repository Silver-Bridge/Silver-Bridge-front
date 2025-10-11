import { LocalStore } from './localStore';
import { ApiStore } from './apiStore';

// true면 서버 사용, false면 로컬만
const USE_SERVER = process.env.EXPO_PUBLIC_USE_SERVER === 'true';

const store = {
    // 읽기: 로컬 우선 → 필요 시 서버로 보정/병합(간단 형태)
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
        // 화면은 inverted라 뒤집어서 쓰지만, 저장은 정방향 유지
        if (!USE_SERVER) return { items: local, next: null };
        const remote = await ApiStore.loadMessages(threadId, { cursor });
        // 서버 메시지 병합
        await LocalStore.applyDelta({ threads: [], messages: { [threadId]: remote.items }, now: Date.now() });
        return remote;
    },

    // 낙관적 전송 지원: 호출자는 임시 메시지를 먼저 UI/로컬에 넣고, 이후 이 메서드로 확정치 받기
    async sendMessage(threadId, text) {
        if (!USE_SERVER) {
            // 서버가 없으면 fake 확정값
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
        if (!USE_SERVER) return; // 로컬만 쓰는 경우 생략
        const since = await LocalStore.getLastSyncAt();
        const delta = await ApiStore.sync(since);
        await LocalStore.applyDelta(delta);
        await LocalStore.setLastSyncAt(delta.now || Date.now());
    },

    // 로컬 직접 접근(낙관적/캐시)
    local: LocalStore,
};

export default store;
