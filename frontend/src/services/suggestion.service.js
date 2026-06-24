import api from './api';

/**
 * Suggestion API service — wraps /api/suggestions endpoints.
 */
const suggestionService = {
  /**
   * Get alternative rooms for a given time slot.
   * @param {{ roomId: string, startTime: string, endTime: string, minCapacity?: number }} params
   */
  async getAlternativeRooms(params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const { data } = await api.get(`/suggestions/rooms?${searchParams.toString()}`);
    return data;
  },

  /**
   * Get alternative time slots for a room on a given date.
   * @param {{ roomId: string, date: string, preferredStartTime?: string }} params
   */
  async getAlternativeSlots(params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const { data } = await api.get(`/suggestions/alternatives?${searchParams.toString()}`);
    return data;
  },

  /**
   * Get smart booking suggestions based on user history.
   */
  async getSmartSuggestions() {
    const { data } = await api.get('/suggestions/smart');
    return data;
  },
};

export default suggestionService;
