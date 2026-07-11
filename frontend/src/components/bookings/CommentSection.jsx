import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import commentService from '../../services/comment.service';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import useSSEEvent from '../../hooks/useSSEEvent';
import './CommentSection.css';

/**
 * CommentSection — full comment thread for a booking.
 * Fetches comments on mount, allows create/edit/delete.
 *
 * @param {{ bookingId: string }} props
 */
function CommentSection({ bookingId }) {
  const { t } = useTranslation();
  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const loadComments = useCallback(async () => {
    try {
      const res = await commentService.getComments(bookingId);
      setComments(res.data || []);
      setError(null);
    } catch (err) {
      setError(t('comments.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [bookingId, t]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useSSEEvent('comments_changed', useCallback((data) => {
    if (data && data.bookingId === bookingId) {
      loadComments();
    }
  }, [bookingId, loadComments]));

  const handleCreate = async (content) => {
    try {
      const res = await commentService.createComment(bookingId, content);
      setComments((prev) => [...prev, res.data]);
      toast.success(t('comments.sendSuccess'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('comments.sendFailed'));
      throw err;
    }
  };

  const handleUpdate = async (commentId, content) => {
    try {
      const res = await commentService.updateComment(bookingId, commentId, content);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? res.data : c))
      );
      toast.success(t('comments.updateSuccess'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('comments.updateFailed'));
      throw err;
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await commentService.deleteComment(bookingId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success(t('comments.deleteSuccess'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('comments.deleteFailed'));
      throw err;
    }
  };

  return (
    <section className="comment-section" aria-label={t('comments.title')}>
      {/* Header */}
      <div className="comment-section__header">
        <span className="comment-section__icon">💬</span>
        <h3 className="comment-section__title">
          {t('comments.title')}
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
          {t('comments.loading')}
        </div>
      ) : error ? (
        <div className="comment-section__error">{error}</div>
      ) : comments.length === 0 ? (
        <div className="comment-section__empty">
          {t('comments.empty')}
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
