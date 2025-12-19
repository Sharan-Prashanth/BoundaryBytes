import api from './api';

export const scoringService = {
  recordBall: async (matchId, data) => {
    const response = await api.post(`/scoring/${matchId}/ball`, data);
    return response.data;
  },

  undoLastBall: async (matchId) => {
    const response = await api.post(`/scoring/${matchId}/undo`);
    return response.data;
  },

  setNewBatter: async (matchId, data) => {
    const response = await api.post(`/scoring/${matchId}/batter`, data);
    return response.data;
  },

  setNewBowler: async (matchId, data) => {
    const response = await api.post(`/scoring/${matchId}/bowler`, data);
    return response.data;
  },

  swapBatters: async (matchId) => {
    const response = await api.post(`/scoring/${matchId}/swap`);
    return response.data;
  },

  startSecondInnings: async (matchId, data) => {
    const response = await api.post(`/scoring/${matchId}/second-innings`, data);
    return response.data;
  },

  getInnings: async (matchId, inningsNumber) => {
    const response = await api.get(`/scoring/${matchId}/innings/${inningsNumber}`);
    return response.data;
  },

  getCurrentOver: async (matchId) => {
    const response = await api.get(`/scoring/${matchId}/current-over`);
    return response.data;
  },

  getBallEvents: async (matchId, inningsNumber) => {
    const response = await api.get(`/scoring/${matchId}/innings/${inningsNumber}/balls`);
    return response.data;
  }
};
