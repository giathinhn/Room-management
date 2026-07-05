import React from 'react';
import { useTranslation } from 'react-i18next';
import './TemplateCard.css';

/**
 * Format a Prisma Time field (1970-01-01T...) to "HH:mm".
 * @param {string} timeStr
 * @param {string} locale
 */
function formatTime(timeStr, locale) {
  if (!timeStr) return '--:--';
  const d = new Date(timeStr);
  return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * TemplateCard — displays one booking template with actions.
 *
 * Props:
 *   template  — BookingTemplate object from API
 *   onUse     — called when user clicks "Đặt ngay"
 *   onEdit    — called when user clicks "Sửa"
 *   onDelete  — called when user clicks "Xóa"
 */
function TemplateCard({ template, onUse, onEdit, onDelete }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN';

  const timeRange = `${formatTime(template.startTime, locale)} – ${formatTime(template.endTime, locale)}`;

  return (
    <div className="tpl-card" tabIndex={0} role="article" aria-label={`Template: ${template.name}`}>
      {/* Header */}
      <div className="tpl-card__header">
        <span className="tpl-card__icon">🔖</span>
        <span className="tpl-card__name">{template.name}</span>
      </div>

      {/* Meta */}
      <div className="tpl-card__meta">
        {template.room ? (
          <span className="tpl-card__room">📍 {template.room.name}</span>
        ) : (
          <span className="tpl-card__room tpl-card__room--none">📍 {t('templates.noRoomSelected')}</span>
        )}
        <span className="tpl-card__time">🕐 {timeRange}</span>
        <span className="tpl-card__title" title={template.title}>
          📋 {template.title}
        </span>
      </div>

      {/* Actions */}
      <div className="tpl-card__actions">
        <button
          id={`tpl-use-${template.id}`}
          className="tpl-card__btn tpl-card__btn--use"
          onClick={() => onUse(template)}
          title={t('templates.bookNow')}
        >
          {t('templates.bookNow')}
        </button>
        <button
          id={`tpl-edit-${template.id}`}
          className="tpl-card__btn tpl-card__btn--edit"
          onClick={() => onEdit(template)}
          title={t('templates.editTitle')}
        >
          {t('templates.editBtn')}
        </button>
        <button
          id={`tpl-delete-${template.id}`}
          className="tpl-card__btn tpl-card__btn--delete"
          onClick={() => onDelete(template)}
          title={t('templates.deleteConfirm', { name: '' }).split('?')[0]}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

export default TemplateCard;
