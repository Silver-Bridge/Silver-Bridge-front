import React, { createContext, useContext, useState } from 'react';

const defaultState = {
    userType: 'USER',  // 'GUARDIAN' | 'USER'
    name: '',
    rrnFront: '',
    rrnBack1: '',
    carrier: '',
    phone: '',
    password: '',
    region: '',
    fontScale: 50,     // 0~100
};

const Ctx = createContext(null);

export function SignupProvider({ children }) {
    const [data, setData] = useState(defaultState);
    return <Ctx.Provider value={{ data, setData }}>{children}</Ctx.Provider>;
}

export function useSignup() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error('useSignup must be used within SignupProvider');
    return ctx;
}
