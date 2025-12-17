// mobile/src/screens/signup/SignupContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';

const defaultState = {
    userType: 'USER',
    role: 'ROLE_MEMBER',
    name: '',
    rrnFront: '',
    rrnBack1: '',
    phone: '',
    password: '',
    region: '',
    fontScale: 50,
    verified: false,
    signupMode: 'normal',
    socialTempToken: null,
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
