import api from './axios';

export const getLeaderboard = async (metric, period) => {
    const response = await api.get('/leaderboard/', {
        params: { metric, period },
    });
    return response.data;
};
