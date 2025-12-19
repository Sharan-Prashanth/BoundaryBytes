import api from './api';

export const playerService = {
  getPlayers: async (params = {}) => {
    const response = await api.get('/players', { params });
    return response.data;
  },

  getPlayer: async (id) => {
    const response = await api.get(`/players/${id}`);
    return response.data;
  },

  createPlayer: async (data) => {
    const response = await api.post('/players', data);
    return response.data;
  },

  createBulkPlayers: async (data) => {
    const response = await api.post('/players/bulk', data);
    return response.data;
  },

  updatePlayer: async (id, data) => {
    const response = await api.put(`/players/${id}`, data);
    return response.data;
  },

  deletePlayer: async (id) => {
    const response = await api.delete(`/players/${id}`);
    return response.data;
  }
};
