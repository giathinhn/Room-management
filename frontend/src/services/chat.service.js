import api from './api';

const chatService = {
  async sendMessage(message) {
    const { data } = await api.post('/ai/chat', { message }, { timeout: 30000 });
    return data;
  },

  async getHistory(limit = 50) {
    const { data } = await api.get('/ai/history', { params: { limit } });
    return data;
  },

  async clearHistory() {
    const { data } = await api.delete('/ai/history');
    return data;
  },
};

export default chatService;
