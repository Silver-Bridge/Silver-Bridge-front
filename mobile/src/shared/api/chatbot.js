// /src/shared/api/chatbot.js
import client from './client';

// 텍스트 대화 (ChatTextRequest → ChatTextResponse)
export async function sendText({ text, sessionId, regionCode }) {
    const body = { text };

    if (sessionId != null) {
        body.sessionId = sessionId;
    }
    if (regionCode) {
        body.regionCode = regionCode; // 없으면 서버에서 std로 처리
    }

    // POST /api/chatbot/text
    const res = await client.post('/chatbot/text', body);
    return res.data; // { sessionId, replyText, history: [...] }
}

// 특정 세션 히스토리 (List<MessageDto>)
export async function getHistory(sessionId) {
    // GET /api/chatbot/history/{sessionId}
    const res = await client.get(`/chatbot/history/${sessionId}`);
    return res.data; // [{ role, content }, ...]
}

// 내 전체 세션 목록 (List<ChatSession>)
export async function getSessions() {
    // GET /api/chatbot/sessions
    const res = await client.get('/chatbot/sessions');
    return res.data; // [{ id, userId, regionCode, createdAt, updatedAt, ... }, ...]
}

// 특정 세션 삭제
export async function deleteSession(sessionId) {
    // DELETE /api/chatbot/session/{sessionId}
    const res = await client.delete(`/chatbot/session/${sessionId}`);
    return res.data; // "세션이 삭제되었습니다."
}

// 음성 대화
export async function sendVoice({ uri, regionCode = 'std', sessionId }) {
    const formData = new FormData();

    formData.append('file', {
        uri,
        name: 'voice.m4a',
        type: 'audio/m4a',
    });

    if (regionCode) {
        formData.append('regionCode', regionCode);
    }
    if (sessionId != null) {
        formData.append('sessionId', String(sessionId));
    }

    // POST /api/chatbot/voice (multipart/form-data)
    const res = await client.post('/chatbot/voice', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    // { sessionId, history: [...], replyAudioUrl, replyText? ... }
    return res.data;
}
