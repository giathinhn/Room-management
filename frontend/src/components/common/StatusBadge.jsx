import React from 'react';
import { useTranslation } from 'react-i18next';
import './StatusBadge.css';

const STATUS_CONFIG = {
  pending: {
    icon: '🟡',
    className: 'badge-pending',
  },
  approved: {
    icon: '🟢',
    className: 'badge-approved',
  },
  rejected: {
    icon: '🔴',
    className: 'badge-rejected',
  },
  cancelled: {
    icon: '⚪',
    className: 'badge-cancelled',
  },
};

/**
 * StatusBadge — displays a colored badge for booking status.
 * @param {{ status: 'pending'|'approved'|'rejected'|'cancelled', showIcon?: boolean }} props
 */
function StatusBadge({ status, showIcon = true }) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[status] || {
    icon: '⚫',
    className: 'badge-default',
  };

  const statusLabel = {
    pending: t('bookings.status.pending'),
    approved: t('bookings.status.approved'),
    rejected: t('bookings.status.rejected'),
    cancelled: t('bookings.status.cancelled'),
  };

  return (
    <span className={`status-badge ${config.className}`}>
      {showIcon && <span className="badge-icon">{config.icon}</span>}
      {statusLabel[status] || status}
    </span>
  );
}

export default StatusBadge;
