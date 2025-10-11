// 공용 타입(주석용) & 헬퍼
export const now = () => Date.now();

// ThreadMeta: { id, title, updatedAt, lastText, unreadCount? }
// Message: { id?, tempId?, threadId, role:'me'|'bot'|'system', text, createdAt, status? }
// Delta: { threads: ThreadMeta[], messages: Record<string, Message[]>, now: number }