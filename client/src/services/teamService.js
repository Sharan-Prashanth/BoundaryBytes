import api from './api';

export const teamService = {
  getTeams: async (params = {}) => {
    const response = await api.get('/teams', { params });
    return response.data;
  },

  getTeam: async (id) => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  createTeam: async (data) => {
    const response = await api.post('/teams', data);
    return response.data;
  },

  updateTeam: async (id, data) => {
    const response = await api.put(`/teams/${id}`, data);
    return response.data;
  },

  deleteTeam: async (id) => {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
  },

  getTeamPlayers: async (id) => {
    const response = await api.get(`/teams/${id}/players`);
    return response.data;
  }
};
