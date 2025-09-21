import client from './client';

export const getRegionsApi = async () => {
    const { data } = await client.get('/meta/regions');
    return data.regions || [];
};

export const getCarriersApi = async () => {
    const { data } = await client.get('/meta/carriers');
    return data.carriers || [];
};
