import client from './client';

export const getTodayScheduleApi = async () => {
    const { data } = await client.get('/home/today-schedule');
    return data.items || [];
};

export const getAssistantSuggestionsApi = async () => {
    const { data } = await client.get('/assistant/suggestions');
    return data.suggestions || [];
};