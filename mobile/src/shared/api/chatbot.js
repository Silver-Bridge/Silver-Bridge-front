// /src/shared/api/chatbot.js
import client from './client'; // 이미 있는 axios 인스턴스

// 텍스트 대화 (ChatTextRequest → ChatTextResponse)
export async function sendText({ text, sessionId, regionCode }) {
    const body = { text };

    if (sessionId != null) {
        body.sessionId = sessionId;
    }
    if (regionCode) {
        body.regionCode = regionCode; // 없으면 서버에서 std로 처리
    }

    // baseURL: API_BASE_URL (예: http://IP:8080/api)
    // => 실제 요청: POST http://IP:8080/api/chatbot/text
    const res = await client.post('/chatbot/text', body);
    // ChatTextResponse: { sessionId, replyText, history: [{role, content}, ...] }
    return res.data;
}

// 특정 세션 히스토리 (List<MessageDto>)
export async function getHistory(sessionId) {
    // GET http://IP:8080/api/chatbot/history/{sessionId}
    const res = await client.get(`/chatbot/history/${sessionId}`);
    return res.data; // [{ role, content }, ...]
}

// 내 전체 세션 목록 (List<ChatSession>)
export async function getSessions() {
    // GET http://IP:8080/api/chatbot/sessions
    const res = await client.get('/chatbot/sessions');
    return res.data; // [{ id, userId, regionCode, createdAt, updatedAt }, ...]
}

// 특정 세션 삭제
export async function deleteSession(sessionId) {
    // DELETE http://IP:8080/api/chatbot/session/{sessionId}
    const res = await client.delete(`/chatbot/session/${sessionId}`);
    return res.data; // "세션이 삭제되었습니다."
}


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

    const res = await client.post('/chatbot/voice', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    // 지금 백엔드 응답 예시:
    // { sessionId, history: [...], replyAudioUrl }
    return res.data;
}