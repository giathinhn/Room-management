const commentService = require('../services/comment.service');

/**
 * Comment controller — handles HTTP endpoints for booking comments.
 */
const commentController = {
  /**
   * GET /api/bookings/:id/comments
   * Returns all comments for a booking.
   */
  async getByBooking(req, res, next) {
    try {
      const comments = await commentService.getByBooking(req.params.id);
      res.json({ data: comments });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/bookings/:id/comments
   * Create a new comment on a booking.
   * Body: { content: string }
   */
  async create(req, res, next) {
    try {
      const comment = await commentService.create(
        req.params.id,
        req.user,
        req.body.content
      );
      res.status(201).json({ data: comment });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/bookings/:id/comments/:cid
   * Update a comment (owner only, within 5 minutes).
   * Body: { content: string }
   */
  async update(req, res, next) {
    try {
      const comment = await commentService.update(
        req.params.cid,
        req.user,
        req.body.content
      );
      res.json({ data: comment });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/bookings/:id/comments/:cid
   * Delete a comment (owner only, within 5 minutes; admin can always delete).
   */
  async delete(req, res, next) {
    try {
      await commentService.delete(req.params.cid, req.user);
      res.json({ message: 'Comment deleted' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = commentController;
