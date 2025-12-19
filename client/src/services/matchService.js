import api from './api';

export const matchService = {
  getMatches: async (params = {}) => {
    const response = await api.get('/matches', { params });
    return response.data;
  },

  getLiveMatches: async () => {
    const response = await api.get('/matches/live');
    return response.data;
  },

  getMatch: async (id) => {
    const response = await api.get(`/matches/${id}`);
    return response.data;
  },

  getMatchByPublicLink: async (publicLink) => {
    const response = await api.get(`/matches/public/${publicLink}`);
    return response.data;
  },

  createMatch: async (data) => {
    const response = await api.post('/matches', data);
    return response.data;
  },

  updateMatch: async (id, data) => {
    const response = await api.put(`/matches/${id}`, data);
    return response.data;
  },

  updateMatchPlayers: async (id, data) => {
    const response = await api.put(`/matches/${id}/players`, data);
    return response.data;
  },

  setToss: async (id, data) => {
    const response = await api.put(`/matches/${id}/toss`, data);
    return response.data;
  },

  startMatch: async (id, data) => {
    const response = await api.post(`/matches/${id}/start`, data);
    return response.data;
  },

  deleteMatch: async (id) => {
    const response = await api.delete(`/matches/${id}`);
    return response.data;
  }
};
