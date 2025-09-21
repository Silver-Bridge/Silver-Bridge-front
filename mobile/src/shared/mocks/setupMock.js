import MockAdapter from 'axios-mock-adapter';
import client from '../api/client';
import { USE_MOCK } from '@env';

const DELAY_MS = 500;

const users = [
    {id:1, name:'서범주',phone:'01039265474', password:'1234', userType:'user',region: '경상도'}
]

//전화번호별로 발송된 인증코드 저장
const phone2code = new Map();
let mockInstance = null;


export function setupMock(axiosInstance) {
    if (USE_MOCK !== 'true') return; // .env에서 USE_MOCK=false면 바로 패스

    if (!axiosInstance || !axiosInstance.defaults) {
        throw new Error('setupMock requires an axios **instance** (e.g., axios.create(...))');
    }
    if (mockInstance) return mockInstance; // 이미 설정되어 있으면 재사용

    const mock = new MockAdapter(client, {delayResponse: DELAY_MS});

    //  =========메타=======
    mock.onGet(`/meta/regions`).reply(200,{
        regions:['충청도', '경상도', '전라도', '그외']
    });
    mock.onGet('meta/carriers').reply(200,{
        carriers: ['SKT', 'KT', 'LGU+', '알뜰폰'],
    })

    // ===== 인증코드 발송 =====
    mock.onPost('/auth/send-code').reply(config => {
        const { phone } = JSON.parse(config.data || '{}');
        if (!phone || !/^\d{10,11}$/.test(phone)) return [400, { message: '휴대폰 번호가 올바르지 않습니다.' }];

        const code = String(Math.floor(100000 + Math.random() * 900000)); // 6자리
        phone2code.set(phone, code);

        // 실제 앱에선 코드를 반환하지 않지만, 개발 편의를 위해 같이 내려줍니다.
        return [200, { success: true, devCode: code }];
    });

    // ===== 인증코드 검증 =====
    mock.onPost('/auth/verify-code').reply(config => {
        const { phone, code } = JSON.parse(config.data || '{}');
        if (!phone || !code) return [400, { message: '필수 값 누락' }];
        const ok = phone2code.get(phone) === code;
        return ok ? [200, { success: true }] : [401, { message: '인증번호가 일치하지 않습니다.' }];
    });

    // ===== 로그인 =====
    mock.onPost('/auth/login').reply(config => {
        const { phone, password } = JSON.parse(config.data || '{}');
        const found = users.find(u => u.phone === phone && u.password === password);
        if (!found) return [401, { message: '전화번호 또는 비밀번호가 올바르지 않습니다.' }];
        return [200, { accessToken: 'mock-' + found.id, user: { id: found.id, name: found.name, phone: found.phone } }];
    });

    // ===== 회원가입 =====
    mock.onPost('/auth/signup').reply(config => {
        const { name, phone, password, userType, region } = JSON.parse(config.data || '{}');
        if (!name || !phone || !password) return [400, { message: '필수 값 누락' }];
        if (users.some(u => u.phone === phone)) return [409, { message: '이미 가입된 전화번호입니다.' }];

        const id = users.length + 1;
        users.push({ id, name, phone, password, userType: userType || 'USER', region: region || '' });

        return [200, { accessToken: 'mock-' + id, user: { id, name, phone } }];
    });

    mockInstance = mock;
    return mockInstance;
}
