import React from 'react';
import './SlotPreview.css';

const DAY_NAMES = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

/**
 * Format a date string 'YYYY-MM-DD' into 'dd/MM (Thứ X)'
 */
function formatSlotDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dayName = DAY_NAMES[d.getDay()];
  return `${dd}/${mm} (${dayName})`;
}

/**
 * Format an ISO time string to 'HH:mm'
 */
function formatTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
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
  const totalSlots = okSlots.length + conflictSlots.length;

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
            Kết quả: {totalSlots} slots
          </span>
          <span className="slot-preview__sub">
            <span className="slot-preview__ok-count">{okSlots.length} có thể đặt</span>
            {conflictSlots.length > 0 && (
              <span className="slot-preview__conflict-count">
                &nbsp;· {conflictSlots.length} bị trùng lịch
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
                {formatSlotDate(slot.date)}
              </span>
              <span className="slot-preview__item-time">
                {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
              </span>
            </div>
            <div className="slot-preview__item-status">
              {slot.type === 'ok' ? (
                <span className="slot-preview__badge slot-preview__badge--ok">Phòng trống</span>
              ) : (
                <div className="slot-preview__conflicts">
                  {slot.conflicts?.map((c, ci) => (
                    <span key={ci} className="slot-preview__badge slot-preview__badge--conflict">
                      Trùng: "{c.title}"
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
            {okSlots.length}/{totalSlots} slots có thể đặt
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
                Đang đặt phòng...
              </>
            ) : (
              <>🗓️ Đặt {okSlots.length} slots khả dụng</>
            )}
          </button>
        </div>
      )}

      {okSlots.length === 0 && (
        <div className="slot-preview__empty">
          <span>⚠️</span>
          <p>Tất cả slots đều bị trùng lịch. Vui lòng chọn thời gian khác.</p>
        </div>
      )}
    </div>
  );
}

export default SlotPreview;
