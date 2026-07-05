import React from 'react';
import { useTranslation } from 'react-i18next';
import './SlotPreview.css';

/**
 * Format a date string 'YYYY-MM-DD' into 'dd/MM (Thứ X)'
 */
function formatSlotDate(dateStr, dayNames) {
  const d = new Date(dateStr + 'T00:00:00');
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dayName = dayNames[d.getDay()];
  return `${dd}/${mm} (${dayName})`;
}

/**
 * Format an ISO time string to 'HH:mm'
 */
function formatTime(isoStr, locale) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

/**
 * SlotPreview — shows the list of slots returned by the recurring preview API.
 *
 * @param {{
 *   okSlots: Array<{ date, startTime, endTime }>,
 *   conflictSlots: Array<{ date, startTime, endTime, conflicts: Array<{ title, bookerName }> }>,
 *   totalGenerated: number,
 *   onConfirm: () => void,
 *   isConfirming: boolean,
 * }} props
 */
function SlotPreview({ okSlots, conflictSlots, totalGenerated, onConfirm, isConfirming }) {
  const { t, i18n } = useTranslation();
  const totalSlots = okSlots.length + conflictSlots.length;

  const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN';
  
  const DAY_NAMES = i18n.language === 'en'
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  // Merge and sort all slots by date for display
  const allSlots = [
    ...okSlots.map((s) => ({ ...s, type: 'ok' })),
    ...conflictSlots.map((s) => ({ ...s, type: 'conflict' })),
  ].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  return (
    <div className="slot-preview">
      {/* Summary Header */}
      <div className="slot-preview__header">
        <span className="slot-preview__icon">📋</span>
        <div className="slot-preview__summary">
          <span className="slot-preview__title">
            {t('bookings.recurring.previewResult', { count: totalSlots })}
          </span>
          <span className="slot-preview__sub">
            <span className="slot-preview__ok-count">{t('bookings.recurring.slotsAvailable', { count: okSlots.length })}</span>
            {conflictSlots.length > 0 && (
              <span className="slot-preview__conflict-count">
                &nbsp;· {t('bookings.recurring.slotsConflict', { count: conflictSlots.length })}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Slot List */}
      <div className="slot-preview__list" role="list">
        {allSlots.map((slot, idx) => (
          <div
            key={idx}
            role="listitem"
            className={`slot-preview__item slot-preview__item--${slot.type}`}
          >
            <span className="slot-preview__item-icon">
              {slot.type === 'ok' ? '✅' : '❌'}
            </span>
            <div className="slot-preview__item-info">
              <span className="slot-preview__item-date">
                {formatSlotDate(slot.date, DAY_NAMES)}
              </span>
              <span className="slot-preview__item-time">
                {formatTime(slot.startTime, locale)} – {formatTime(slot.endTime, locale)}
              </span>
            </div>
            <div className="slot-preview__item-status">
              {slot.type === 'ok' ? (
                <span className="slot-preview__badge slot-preview__badge--ok">{t('bookings.recurring.roomAvailable')}</span>
              ) : (
                <div className="slot-preview__conflicts">
                  {slot.conflicts?.map((c, ci) => (
                    <span key={ci} className="slot-preview__badge slot-preview__badge--conflict">
                      {t('bookings.recurring.conflictPrefix')}"{c.title}"
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      {okSlots.length > 0 && (
        <div className="slot-preview__footer">
          <p className="slot-preview__footer-info">
            {okSlots.length}/{totalSlots} {t('bookings.recurring.slotsAvailable', { count: okSlots.length }).replace(`${okSlots.length} `, '')}
          </p>
          <button
            id="confirm-recurring-btn"
            type="button"
            className="slot-preview__confirm-btn"
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? (
              <>
                <span className="slot-preview__spinner" />
                {t('bookings.form.submitting')}
              </>
            ) : (
              <>🗓️ {t('bookings.recurring.slotsAvailableBook', { count: okSlots.length })}</>
            )}
          </button>
        </div>
      )}

      {okSlots.length === 0 && (
        <div className="slot-preview__empty">
          <span>⚠️</span>
          <p>{t('bookings.recurring.slotsAllConflict')}</p>
        </div>
      )}
    </div>
  );
}

export default SlotPreview;
