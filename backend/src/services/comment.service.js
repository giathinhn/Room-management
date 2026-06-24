const commentRepository = require('../repositories/comment.repository');
const bookingRepository = require('../repositories/booking.repository');
const ApiError = require('../utils/ApiError');

/** Edit/delete window in milliseconds (5 minutes) */
const EDIT_WINDOW_MS = 5 * 60 * 1000;

/**
 * Comment service — business logic for booking comments.
 */
const commentService = {
  /**
   * Get all comments for a booking.
   * Verifies the booking exists.
   *
   * @param {string} bookingId
   */
  async getByBooking(bookingId) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw ApiError.notFound('Booking not found');
    }
    return commentRepository.findByBookingId(bookingId);
  },

  /**
   * Create a comment on a booking.
   * Only users related to the booking (owner, approver, admin) can comment.
   *
   * @param {string} bookingId
   * @param {{ id: string, role: string }} user — authenticated user
   * @param {string} content
   */
  async create(bookingId, user, content) {
    if (!content || content.trim().length === 0) {
      throw ApiError.badRequest('Nội dung bình luận không được để trống');
    }
    if (content.length > 1000) {
      throw ApiError.badRequest('Nội dung bình luận tối đa 1000 ký tự');
    }

    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw ApiError.notFound('Booking not found');
    }

    // Only owner, approver (approvedBy), or admin can comment
    const isOwner    = booking.userId === user.id;
    const isApprover = booking.approvedBy === user.id;
    const isAdmin    = user.role === 'admin';
    const isApproverRole = user.role === 'approver';

    if (!isOwner && !isApprover && !isAdmin && !isApproverRole) {
      throw ApiError.forbidden('Bạn không có quyền bình luận trên booking này');
    }

    return commentRepository.create({
      bookingId,
      userId: user.id,
      content: content.trim(),
    });
  },

  /**
   * Update a comment (only owner, within 5 minutes of creation).
   *
   * @param {string} commentId
   * @param {{ id: string, role: string }} user
   * @param {string} content
   */
  async update(commentId, user, content) {
    if (!content || content.trim().length === 0) {
      throw ApiError.badRequest('Nội dung bình luận không được để trống');
    }
    if (content.length > 1000) {
      throw ApiError.badRequest('Nội dung bình luận tối đa 1000 ký tự');
    }

    const comment = await commentRepository.findById(commentId);
    if (!comment) {
      throw ApiError.notFound('Comment not found');
    }

    // Only the comment owner can edit
    if (comment.userId !== user.id) {
      throw ApiError.forbidden('Bạn không có quyền sửa bình luận này');
    }

    // Only within 5 minutes
    const ageMs = Date.now() - new Date(comment.createdAt).getTime();
    if (ageMs > EDIT_WINDOW_MS) {
      throw ApiError.forbidden('Chỉ được sửa bình luận trong vòng 5 phút đầu');
    }

    return commentRepository.update(commentId, content.trim());
  },

  /**
   * Delete a comment (only owner, within 5 minutes of creation).
   *
   * @param {string} commentId
   * @param {{ id: string, role: string }} user
   */
  async delete(commentId, user) {
    const comment = await commentRepository.findById(commentId);
    if (!comment) {
      throw ApiError.notFound('Comment not found');
    }

    // Only the comment owner (or admin) can delete
    const isOwner = comment.userId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('Bạn không có quyền xóa bình luận này');
    }

    // Only within 5 minutes (admins bypass this)
    if (!isAdmin) {
      const ageMs = Date.now() - new Date(comment.createdAt).getTime();
      if (ageMs > EDIT_WINDOW_MS) {
        throw ApiError.forbidden('Chỉ được xóa bình luận trong vòng 5 phút đầu');
      }
    }

    await commentRepository.delete(commentId);
  },
};

module.exports = commentService;
