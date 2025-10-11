import React, { createContext, useContext, useState } from 'react';
/*
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
}; */

const defaultState = {
    // 마이페이지 테스트를 위한 핵심 목 데이터
    userType: 'USER',
    name: '김철수', // 이름 목 데이터
    rrnFront: '990101',
    rrnBack1: '1',
    carrier: 'SKT',
    phone: '010-9999-8888', // 전화번호 목 데이터
    password: 'testpassword123',
    region: '경상도', // 지역 초기값 목 데이터
    fontScale: 75,     // 글자 크기 목 데이터 (75%로 설정)
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
