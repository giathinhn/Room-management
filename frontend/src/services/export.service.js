import api from './api';

/**
 * Export API service — handles Excel export download.
 */
const exportService = {
  /**
   * Download bookings as an Excel file (.xlsx).
   * Passes the current filters so the export matches what the user sees.
   *
   * @param {{ roomId?, status?, startDate?, endDate?, userId? }} filters
   */
  async exportBookings(filters = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      searchParams.append(key, value);
    });

    const response = await api.get(`/export/bookings?${searchParams.toString()}`, {
      responseType: 'blob',
    });

    // Create a temporary download link and trigger click
    const blob  = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `bookings_${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};

export default exportService;
