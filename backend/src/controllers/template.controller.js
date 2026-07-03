const templateService = require('../services/template.service');
const bookingService = require('../services/booking.service');
const { createTemplateSchema, updateTemplateSchema } = require('../validators/template.validator');

/**
 * Template controller — HTTP request/response handling for /api/templates.
 */
const templateController = {
  /**
   * GET /api/templates
   * Return all templates belonging to the authenticated user.
   */
  async getAll(req, res, next) {
    try {
      const templates = await templateService.getByUser(req.user.id);
      return res.json({
        success: true,
        data: templates,
        count: templates.length,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/templates
   * Create a new template.
   */
  async create(req, res, next) {
    try {
      const parsed = createTemplateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: (parsed.error.errors || parsed.error.issues || []).map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      const template = await templateService.create(req.user.id, parsed.data);
      return res.status(201).json({
        success: true,
        message: 'Tạo mẫu đặt phòng thành công',
        data: template,
      });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
        });
      }
      next(err);
    }
  },

  /**
   * PUT /api/templates/:id
   * Update an existing template (owner only).
   */
  async update(req, res, next) {
    try {
      const parsed = updateTemplateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: (parsed.error.errors || parsed.error.issues || []).map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      const template = await templateService.update(req.params.id, req.user.id, parsed.data);
      return res.json({
        success: true,
        message: 'Cập nhật mẫu thành công',
        data: template,
      });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
        });
      }
      next(err);
    }
  },

  /**
   * DELETE /api/templates/:id
   * Delete a template (owner only).
   */
  async delete(req, res, next) {
    try {
      await templateService.delete(req.params.id, req.user.id);
      return res.json({
        success: true,
        message: 'Đã xóa mẫu đặt phòng',
      });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
        });
      }
      next(err);
    }
  },

  /**
   * POST /api/templates/from-booking/:bookingId
   * Save an existing approved booking as a template.
   * Body: { name: string }
   */
  async createFromBooking(req, res, next) {
    try {
      const { bookingId } = req.params;
      const { name } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Tên mẫu là bắt buộc',
        });
      }

      // Fetch the booking (ownership check handled inside)
      const bookingData = await bookingService.getById(bookingId, req.user);

      const template = await templateService.createFromBooking(
        req.user.id,
        bookingData,
        name.trim()
      );

      return res.status(201).json({
        success: true,
        message: 'Đã lưu booking làm mẫu',
        data: template,
      });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
        });
      }
      next(err);
    }
  },
};

module.exports = templateController;
