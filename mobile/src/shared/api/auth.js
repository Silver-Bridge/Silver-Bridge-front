import client from './client';

export const sendCodeApi = async (phone) => {
    const { data } = await client.post('/auth/send-code', { phone });
    return data; // { success, devCode }
};

export const verifyCodeApi = async ({ phone, code }) => {
    const { data } = await client.post('/auth/verify-code', { phone, code });
    return data; // { success: true }
};

export const signupApi = async (payload) => {
    const { data } = await client.post('/auth/signup', payload);
    return data; // { accessToken, user }
};

export const loginApi = async ({ phone, password }) => {
    const { data } = await client.post('/auth/login', { phone, password });
    return data; // { accessToken, user }
};
