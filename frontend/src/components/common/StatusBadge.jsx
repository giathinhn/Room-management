import React from 'react';
import './StatusBadge.css';

const STATUS_CONFIG = {
  pending: {
    label: 'Chờ duyệt',
    icon: '🟡',
    className: 'badge-pending',
  },
  approved: {
    label: 'Đã duyệt',
    icon: '🟢',
    className: 'badge-approved',
  },
  rejected: {
    label: 'Từ chối',
    icon: '🔴',
    className: 'badge-rejected',
  },
  cancelled: {
    label: 'Đã hủy',
    icon: '⚪',
    className: 'badge-cancelled',
  },
};

/**
 * StatusBadge — displays a colored badge for booking status.
 * @param {{ status: 'pending'|'approved'|'rejected'|'cancelled', showIcon?: boolean }} props
 */
function StatusBadge({ status, showIcon = true }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    icon: '⚫',
    className: 'badge-default',
  };

  return (
    <span className={`status-badge ${config.className}`}>
      {showIcon && <span className="badge-icon">{config.icon}</span>}
      {config.label}
    </span>
  );
}

export default StatusBadge;
