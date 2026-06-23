const exportService = require('../services/export.service');

/**
 * Export controller — thin HTTP layer for export endpoints.
 */
const exportController = {
  /**
   * GET /api/export/bookings
   * Query: roomId?, status?, startDate?, endDate?, userId?
   * Response: .xlsx file download (admin/approver only)
   */
  async exportBookings(req, res, next) {
    try {
      const buffer = await exportService.exportBookingsToExcel(req.query);

      const filename = `bookings_${Date.now()}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = exportController;
