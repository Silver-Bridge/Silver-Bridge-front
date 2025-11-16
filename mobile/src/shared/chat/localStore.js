// mobile/src/shared/chat/localStore.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// createdAt/updatedAt 용 간단 유틸
const now = () => Date.now();

// ──────────────────────────────────────────────
// Keys
// ──────────────────────────────────────────────
const KEY_THREADS     = 'CHAT_THREADS';               // 스레드 메타 리스트
const KEY_THREAD      = (id) => `CHAT_THREAD_${id}`;  // 각 스레드 메시지 저장
const KEY_LAST_SYNC   = 'CHAT_LAST_SYNC_AT';

// ──────────────────────────────────────────────
// JSON Helpers
// ──────────────────────────────────────────────
async function getJSON(key, fallback) {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    try {
        const parsed = JSON.parse(raw);
        // 혹시 서버 응답을 그대로 저장한 경우 대비 (Data / data 필드 정규화)
        if (parsed && typeof parsed === 'object') {
            if (parsed.Data) return parsed.Data;
            if (parsed.data) return parsed.data;
        }
        return parsed;
    } catch (e) {
        console.warn('[LocalStore] JSON parse error:', e?.message || e);
        return fallback;
    }
}

async function setJSON(key, v) {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(v));
    } catch (e) {
        console.warn('[LocalStore] JSON save error:', e?.message || e);
    }
}

// ──────────────────────────────────────────────
// 내부 유틸: 스레드 메타 upsert
//  meta shape:
//    { id: string, title: string, updatedAt: number, lastText: string, serverSessionId?: string }
// ──────────────────────────────────────────────
function normalizeMeta(meta) {
    if (!meta) return null;
    return {
        id: String(meta.id),
        title: meta.title ?? '대화',
        updatedAt: Number(meta.updatedAt ?? now()),
        lastText: String(meta.lastText ?? ''),
        ...(meta.serverSessionId ? { serverSessionId: String(meta.serverSessionId) } : {}),
    };
}

async function upsertThreadMeta(meta) {
    const m = normalizeMeta(meta);
    if (!m) return;

    const list = await getJSON(KEY_THREADS, []);
    const idx = list.findIndex((t) => String(t.id) === m.id);
    let next;

    if (idx >= 0) {
        // 기존 항목 갱신 (title/lastText/updatedAt/serverSessionId 머지)
        const prev = normalizeMeta(list[idx]);
        next = { ...prev, ...m };
        list.splice(idx, 1, next);
    } else {
        next = m;
        list.unshift(next);
    }

    // 최신순 정렬
    const sorted = list
        .map(normalizeMeta)
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    await setJSON(KEY_THREADS, sorted);
}

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────
export const LocalStore = {
    // ── sync time
    async getLastSyncAt() {
        return (await AsyncStorage.getItem(KEY_LAST_SYNC)) || '0';
    },
    async setLastSyncAt(ts) {
        await AsyncStorage.setItem(KEY_LAST_SYNC, String(ts));
    },

    // ── threads list
    async loadThreads() {
        const list = await getJSON(KEY_THREADS, []);
        return Array.isArray(list)
            ? list.map(normalizeMeta).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
            : [];
    },
    async saveThreads(list) {
        const normalized = (Array.isArray(list) ? list : [])
            .map(normalizeMeta)
            .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        await setJSON(KEY_THREADS, normalized);
    },

    // ── ensure thread meta
    async ensureThread(id, title = '대화') {
        const list = await this.loadThreads();
        const found = list.find((t) => String(t.id) === String(id));
        if (!found) {
            await upsertThreadMeta({
                id: String(id),
                title,
                updatedAt: now(),
                lastText: '',
            });
        }
    },

    // ── get/set thread meta
    async getThreadMeta(id) {
        const list = await this.loadThreads();
        return list.find((t) => String(t.id) === String(id)) || null;
    },

    async setThreadMeta(id, patch) {
        const cur = (await this.getThreadMeta(id)) || { id: String(id) };
        await upsertThreadMeta({ ...cur, ...patch, id: String(id) });
    },

    // 서버 세션 매핑 (중요!)
    async setServerSessionId(threadId, serverSessionId) {
        if (!serverSessionId) return;
        await this.setThreadMeta(String(threadId), { serverSessionId: String(serverSessionId) });
    },

    // 제목 변경(옵션)
    async renameThread(threadId, title) {
        if (!title) return;
        await this.setThreadMeta(String(threadId), { title: String(title) });
    },

    // 스레드 삭제
    async deleteThread(threadId) {
        const id = String(threadId);
        const list = await this.loadThreads();
        const filtered = list.filter((t) => String(t.id) !== id);
        await this.saveThreads(filtered);
        await AsyncStorage.removeItem(KEY_THREAD(id));
    },

    // ── messages (정방향: 오래된 → 최신)
    async loadMessages(threadId) {
        return (await getJSON(KEY_THREAD(String(threadId)), [])) || [];
    },
    async saveMessages(threadId, items) {
        await setJSON(KEY_THREAD(String(threadId)), Array.isArray(items) ? items : []);
    },

    // 메시지 추가 + 메타 업데이트(lastText/updatedAt)
    async appendMessage(threadId, msg) {
        const id = String(threadId);
        const list = await this.loadMessages(id);
        const newList = [...list, msg]; // 오래된 → 최신
        await this.saveMessages(id, newList);

        const lastText = String((msg?.text || '')).slice(0, 200);
        const meta = await this.getThreadMeta(id);
        await upsertThreadMeta({
            id,
            title: meta?.title ?? '대화',
            lastText,
            updatedAt: Number(msg?.createdAt || now()),
            serverSessionId: meta?.serverSessionId,
        });
    },

    // tempId → 서버 확정 메시지 치환
    async replaceTemp(threadId, tempId, confirmed) {
        const id = String(threadId);
        const list = await this.loadMessages(id);
        const newList = list.map((m) => (m.tempId === tempId ? { ...confirmed } : m));
        await this.saveMessages(id, newList);

        // 확정 메시지로 lastText/updatedAt 갱신
        const lastText = String((confirmed?.text || '')).slice(0, 200);
        const meta = await this.getThreadMeta(id);
        await upsertThreadMeta({
            id,
            title: meta?.title ?? '대화',
            lastText,
            updatedAt: Number(confirmed?.createdAt || now()),
            serverSessionId: meta?.serverSessionId,
        });
    },

    async markError(threadId, tempId) {
        const id = String(threadId);
        const list = await this.loadMessages(id);
        const newList = list.map((m) => (m.tempId === tempId ? { ...m, status: 'error' } : m));
        await this.saveMessages(id, newList);
    },

    // 서버 delta 적용 (옵션: 서버 동기화가 있을 때 사용)
    // delta = {
    //   threads: [{id,title,updatedAt,lastText,serverSessionId}, ...],
    //   messages: { [threadId]: [ {id, role, text, createdAt, ...}, ... ] }
    // }
    async applyDelta(delta) {
        // 1) threads upsert
        const curThreads = await this.loadThreads();
        const map = new Map(curThreads.map((t) => [String(t.id), t]));
        for (const t of (delta.threads || [])) {
            const merged = normalizeMeta({ ...map.get(String(t.id)), ...t, id: String(t.id) });
            map.set(String(t.id), merged);
        }
        const mergedThreads = Array.from(map.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        await this.saveThreads(mergedThreads);

        // 2) messages merge (중복 제거 + 정렬)
        const msgByThread = delta.messages || {};
        for (const threadId of Object.keys(msgByThread)) {
            const id = String(threadId);
            const existing = await this.loadMessages(id);
            const incoming = msgByThread[threadId] || [];
            const byId = new Map();
            [...existing, ...incoming].forEach((m) => byId.set(String(m.id || m.tempId), m));
            const merged = Array.from(byId.values()).sort((a, b) => Number(a.createdAt) - Number(b.createdAt));
            await this.saveMessages(id, merged);
        }
    },
};
