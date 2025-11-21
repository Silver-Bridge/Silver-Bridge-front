// mobile/src/screens/signup/SignupContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';

// 초기값
const defaultState = {
    userType: 'USER',    // 'GUARDIAN' | 'USER'
    role: 'ROLE_MEMBER',
    name: '',
    rrnFront: '',
    rrnBack1: '',
    phone: '',           // 입력/저장은 숫자만
    password: '',
    region: '',
    fontScale: 50,       // 0~100
    verified: false,     // ⬅️ SMS 인증 완료 여부
    //alarmActive: true,   // 🔹 알림 기본값: ON
};

const Ctx = createContext(null);

//컨텍스트를 앱 트리(회원가입 스택) 최상단에 감싸주는 컴포넌트
export function SignupProvider({ children }) {
    const [data, setData] = useState(defaultState);

    const resetSignup = useCallback(() => setData(defaultState), []);

    return (
        <Ctx.Provider value={{ data, setData, resetSignup }}>
            {children}
        </Ctx.Provider>
    );
}


// 어디서든 읽고 / 수정 가능
export function useSignup() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error('useSignup must be used within SignupProvider');
    return ctx;
}
