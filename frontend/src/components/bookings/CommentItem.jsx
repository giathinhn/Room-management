import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

/** Milliseconds in 5 minutes */
const EDIT_WINDOW_MS = 5 * 60 * 1000;

/**
 * Returns time ago string in selected language.
 * @param {string} dateStr
 * @param {function} t
 */
function timeAgo(dateStr, t) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('comments.timeAgo.justNow');
  if (mins < 60) return t('comments.timeAgo.minutesAgo', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('comments.timeAgo.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  return t('comments.timeAgo.daysAgo', { count: days });
}

/** Role badge label in selected language */
function roleBadge(role, t) {
  if (role === 'admin')    return { label: t('roles.admin'),    cls: 'comment-item__badge--admin' };
  if (role === 'approver') return { label: t('roles.approver'), cls: 'comment-item__badge--approver' };
  return                          { label: t('roles.user'),     cls: 'comment-item__badge--user' };
}

/**
 * CommentItem — single comment with edit/delete actions.
 *
 * @param {{
 *   comment: object,
 *   bookingId: string,
 *   onUpdate: (commentId: string, content: string) => Promise<void>,
 *   onDelete: (commentId: string) => Promise<void>,
 * }} props
 */
function CommentItem({ comment, bookingId, onUpdate, onDelete }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [editing, setEditing]     = useState(false);
  const [editText, setEditText]   = useState(comment.content);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);

  const isOwner  = user?.id === comment.userId;
  const isAdmin  = user?.role === 'admin';
  const ageMs    = Date.now() - new Date(comment.createdAt).getTime();
  const canEdit  = isOwner && ageMs <= EDIT_WINDOW_MS;
  const canDelete = (isOwner && ageMs <= EDIT_WINDOW_MS) || isAdmin;

  const badge = roleBadge(comment.user?.role, t);
  const initials = (comment.user?.fullName || comment.user?.email || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSave = async () => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      await onUpdate(comment.id, editText.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('comments.confirmDelete'))) return;
    setDeleting(true);
    try {
      await onDelete(comment.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="comment-item">
      {/* Avatar */}
      <div className="comment-item__avatar" aria-hidden="true">
        {initials}
      </div>

      {/* Body */}
      <div className="comment-item__body">
        {/* Header row */}
        <div className="comment-item__header">
          <span className="comment-item__name">
            {comment.user?.fullName || comment.user?.email}
          </span>
          <span className={`comment-item__badge ${badge.cls}`}>{badge.label}</span>
          <span className="comment-item__time">{timeAgo(comment.createdAt, t)}</span>
        </div>

        {/* Content or edit area */}
        {editing ? (
          <div className="comment-item__edit">
            <textarea
              className="comment-item__edit-textarea"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              maxLength={1000}
              rows={3}
              autoFocus
            />
            <div className="comment-item__edit-actions">
              <button
                id={`comment-save-${comment.id}`}
                className="comment-item__btn comment-item__btn--save"
                onClick={handleSave}
                disabled={saving || !editText.trim()}
              >
                {saving ? t('common.saving') : `✓ ${t('common.save')}`}
              </button>
              <button
                id={`comment-cancel-${comment.id}`}
                className="comment-item__btn comment-item__btn--cancel"
                onClick={() => { setEditing(false); setEditText(comment.content); }}
                disabled={saving}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <p className="comment-item__content">{comment.content}</p>
        )}

        {/* Edit / Delete buttons */}
        {!editing && (canEdit || canDelete) && (
          <div className="comment-item__actions">
            {canEdit && (
              <button
                id={`comment-edit-${comment.id}`}
                className="comment-item__btn comment-item__btn--edit"
                onClick={() => setEditing(true)}
              >
                {t('common.edit')}
              </button>
            )}
            {canDelete && (
              <button
                id={`comment-delete-${comment.id}`}
                className="comment-item__btn comment-item__btn--delete"
                onClick={handleDelete}
                disabled={deleting}
              >
                {t('common.delete')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentItem;
