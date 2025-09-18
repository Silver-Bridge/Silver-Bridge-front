import client from '/client';

export const loginApi = async ({email,password}) => {
    const{data} = await client.post('/auth/login', {email,password});
    return data;
}