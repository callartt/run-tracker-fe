import api from './axios';

export const createChallenge = (data) => api.post('/challenges/', data);

export const getChallenges = (params) => api.get('/challenges/', { params });

export const getChallenge = (id) => api.get(`/challenges/${id}`);
export const getChallengeByRunId = (runId) => api.get(`/challenges/run/${runId}`);
export const getChallengeAttempts = (id) => api.get(`/challenges/${id}/attempts`);
export const attemptChallenge = (id, data) => api.post(`/challenges/${id}/attempt`, data);
