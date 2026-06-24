import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import commentService from '../../services/comment.service';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import './CommentSection.css';

/**
 * CommentSection — full comment thread for a booking.
 * Fetches comments on mount, allows create/edit/delete.
 *
 * @param {{ bookingId: string }} props
 */
function CommentSection({ bookingId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const loadComments = useCallback(async () => {
    try {
      const res = await commentService.getComments(bookingId);
      setComments(res.data || []);
      setError(null);
    } catch (err) {
      setError('Không thể tải bình luận');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleCreate = async (content) => {
    try {
      const res = await commentService.createComment(bookingId, content);
      setComments((prev) => [...prev, res.data]);
      toast.success('Đã gửi bình luận');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi bình luận thất bại');
      throw err;
    }
  };

  const handleUpdate = async (commentId, content) => {
    try {
      const res = await commentService.updateComment(bookingId, commentId, content);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? res.data : c))
      );
      toast.success('Đã cập nhật bình luận');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
      throw err;
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await commentService.deleteComment(bookingId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success('Đã xóa bình luận');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa thất bại');
      throw err;
    }
  };

  return (
    <section className="comment-section" aria-label="Bình luận">
      {/* Header */}
      <div className="comment-section__header">
        <span className="comment-section__icon">💬</span>
        <h3 className="comment-section__title">
          Bình luận
          {comments.length > 0 && (
            <span className="comment-section__count">({comments.length})</span>
          )}
        </h3>
      </div>

      <div className="comment-section__divider" />

      {/* Comment list */}
      {loading ? (
        <div className="comment-section__loading">
          <span className="spinner-sm" />
          Đang tải...
        </div>
      ) : error ? (
        <div className="comment-section__error">{error}</div>
      ) : comments.length === 0 ? (
        <div className="comment-section__empty">
          Chưa có bình luận nào. Hãy là người đầu tiên!
        </div>
      ) : (
        <div className="comment-section__list">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              bookingId={bookingId}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Input */}
      <div className="comment-section__input-wrapper">
        <CommentInput onSubmit={handleCreate} disabled={loading} />
      </div>
    </section>
  );
}

export default CommentSection;
