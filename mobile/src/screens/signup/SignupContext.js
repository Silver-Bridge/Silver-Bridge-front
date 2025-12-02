// mobile/src/screens/signup/SignupContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';

const defaultState = {
    userType: 'USER',    // 'GUARDIAN' | 'USER'
    role: 'ROLE_MEMBER',
    name: '',
    rrnFront: '',
    rrnBack1: '',
    phone: '',           // 숫자만
    password: '',
    region: '',
    fontScale: 50,
    verified: false,

    // 🔹 소셜 회원가입용
    signupMode: 'normal',     // 'normal' | 'social'
    socialTempToken: null,    // 백엔드 임시 JWT
};

const Ctx = createContext(null);

export function SignupProvider({ children }) {
    const [data, setData] = useState(defaultState);

    const resetSignup = useCallback(() => setData(defaultState), []);

    return (
        <Ctx.Provider value={{ data, setData, resetSignup }}>
            {children}
        </Ctx.Provider>
    );
}

export function useSignup() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error('useSignup must be used within SignupProvider');
    return ctx;
}
