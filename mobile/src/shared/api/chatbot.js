// /src/shared/api/chatbot.js
import client from './client';

// 채팅 전송
export async function sendText({ text, sessionId, regionCode, region }) {
    const body = { text };

    if (sessionId != null) {
        body.sessionId = sessionId;
    }
    if (regionCode) {
        body.regionCode = regionCode;
    }
    if (region) {
        body.region = region;
    }

    // POST /api/chatbot/text
    const res = await client.post('/chatbot/text', body);
    return res.data;
}

// 특정 세션 히스토리
export async function getHistory(sessionId) {
    // GET /api/chatbot/history/{sessionId}
    const res = await client.get(`/chatbot/history/${sessionId}`);
    return res.data;
}

// 내 전체 세션 목록
export async function getSessions() {
    // GET /api/chatbot/sessions
    const res = await client.get('/chatbot/sessions');
    return res.data;
}

//  특정 세션 삭제
export async function deleteSession(sessionId) {
    // DELETE /api/chatbot/session/{sessionId}
    const res = await client.delete(`/chatbot/session/${sessionId}`);
    return res.data;
}

// 음성대화
export async function sendVoice({ uri, regionCode = 'std', sessionId, region }) {
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
    if (region) {
        formData.append('region', region);
    }

    // POST /api/chatbot/voice (multipart/form-data)
    const res = await client.post('/chatbot/voice', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
}
