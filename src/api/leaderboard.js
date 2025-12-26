import api from './axios';

export const getLeaderboard = async (metric, period, friendsOnly = false) => {
    const response = await api.get('/leaderboard/', {
        params: { metric, period, friends_only: friendsOnly },
    });
    return response.data;
};
