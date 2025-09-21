// src/shared/api/auth.js
import client from './client';

export const loginApi = async ({ phone, password }) => {
    const { data } = await client.post('/auth/login', { phone, password });
    return data; // { accessToken, user }
};
