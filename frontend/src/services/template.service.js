import api from './api';

/**
 * Template API service — wraps all /api/templates endpoints.
 */
const templateService = {
  /**
   * Get all templates for the authenticated user.
   */
  async getTemplates() {
    const { data } = await api.get('/templates');
    return data;
  },

  /**
   * Create a new booking template.
   * @param {{ name, roomId?, title, startTime, endTime }} templateData
   */
  async createTemplate(templateData) {
    const { data } = await api.post('/templates', templateData);
    return data;
  },

  /**
   * Update an existing template (owner only).
   * @param {string} id
   * @param {{ name?, roomId?, title?, startTime?, endTime? }} templateData
   */
  async updateTemplate(id, templateData) {
    const { data } = await api.put(`/templates/${id}`, templateData);
    return data;
  },

  /**
   * Delete a template (owner only).
   * @param {string} id
   */
  async deleteTemplate(id) {
    const { data } = await api.delete(`/templates/${id}`);
    return data;
  },

  /**
   * Save an existing booking as a template.
   * @param {string} bookingId
   * @param {string} name  — template name
   */
  async createFromBooking(bookingId, name) {
    const { data } = await api.post(`/templates/from-booking/${bookingId}`, { name });
    return data;
  },
};

export default templateService;
