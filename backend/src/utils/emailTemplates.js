/**
 * Email HTML templates for Meeting Room notifications.
 * Each function returns a complete HTML string for the email body.
 *
 * Design: responsive, branded, gradient header, clean table layout.
 * Safe for major email clients (Gmail, Outlook, Apple Mail).
 */

// ─── Shared Helpers ────────────────────────────────────────────────────────────

/**
 * Format a JS Date to a readable Vietnamese-friendly date string.
 * e.g. "Thứ Ba, 24/06/2026"
 * @param {Date} date
 */
function formatDate(date) {
  const d = new Date(date);
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = days[d.getDay()];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dayName}, ${dd}/${mm}/${yyyy}`;
}

/**
 * Format a JS Date to HH:MM time string.
 * @param {Date} date
 */
function formatTime(date) {
  const d = new Date(date);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Wrap content in the shared email layout shell.
 * @param {{ headerColor: string, icon: string, title: string, bodyHtml: string }} opts
 */
function layout({ headerColor, icon, title, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">

          <!-- ── Header ── -->
          <tr>
            <td style="background:${headerColor};padding:36px 30px;text-align:center;">
              <div style="font-size:48px;margin-bottom:12px;">${icon}</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">${title}</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Meeting Room Management System</p>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td style="background:#ffffff;padding:32px 30px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="background:#f8fafc;padding:20px 30px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                Đây là email tự động từ hệ thống đặt phòng họp.<br/>
                Vui lòng không trả lời email này.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Render an info table row (label + value).
 * @param {string} label
 * @param {string} value
 */
function row(label, value) {
  return `<tr>
    <td style="padding:10px 12px;color:#64748b;font-size:14px;width:120px;vertical-align:top;white-space:nowrap;">${label}</td>
    <td style="padding:10px 12px;color:#1e293b;font-size:14px;font-weight:600;vertical-align:top;">${value || '—'}</td>
  </tr>`;
}

/**
 * Render booking detail table (room, date, time, title).
 * @param {object} booking
 */
function bookingTable(booking) {
  return `<table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:10px;overflow:hidden;margin-top:20px;">
    ${row('📍 Phòng', booking.room?.name)}
    ${row('🗓️ Ngày', formatDate(booking.startTime))}
    ${row('⏰ Thời gian', `${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}`)}
    ${row('📋 Tiêu đề', booking.title)}
  </table>`;
}

// ─── Templates ─────────────────────────────────────────────────────────────────

/**
 * Email sent to booker when their booking is approved.
 * @param {object} booking — includes room, user, approver
 */
function bookingApproved(booking) {
  const approverName = booking.approver?.fullName || 'Quản trị viên';

  const body = `
    <h2 style="margin:0 0 8px;color:#16a34a;font-size:20px;font-weight:700;">
      Lịch đặt phòng đã được duyệt!
    </h2>
    <p style="margin:0 0 4px;color:#475569;font-size:14px;">
      Xin chào <strong>${booking.user?.fullName || 'bạn'}</strong>,
    </p>
    <p style="margin:0 0 20px;color:#475569;font-size:14px;">
      Yêu cầu đặt phòng họp của bạn đã được duyệt thành công. Chi tiết:
    </p>

    ${bookingTable(booking)}

    <table style="width:100%;border-collapse:collapse;margin-top:8px;">
      ${row('✅ Người duyệt', approverName)}
    </table>

    <div style="margin-top:24px;padding:16px;background:#dcfce7;border-radius:10px;border-left:4px solid #16a34a;">
      <p style="margin:0;color:#166534;font-size:13px;line-height:1.6;">
        💡 <strong>Nhắc nhở:</strong> Vui lòng có mặt đúng giờ. Hệ thống sẽ gửi email nhắc lịch trước 15 phút.
      </p>
    </div>
  `;

  return layout({
    headerColor: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    icon: '✅',
    title: 'Lịch đặt phòng đã được duyệt',
    bodyHtml: body,
  });
}

/**
 * Email sent to booker when their booking is rejected.
 * @param {object} booking — includes room, user
 */
function bookingRejected(booking) {
  const body = `
    <h2 style="margin:0 0 8px;color:#dc2626;font-size:20px;font-weight:700;">
      Lịch đặt phòng bị từ chối
    </h2>
    <p style="margin:0 0 4px;color:#475569;font-size:14px;">
      Xin chào <strong>${booking.user?.fullName || 'bạn'}</strong>,
    </p>
    <p style="margin:0 0 20px;color:#475569;font-size:14px;">
      Rất tiếc, yêu cầu đặt phòng họp của bạn đã bị từ chối. Chi tiết:
    </p>

    ${bookingTable(booking)}

    ${
      booking.rejectionReason
        ? `<div style="margin-top:16px;padding:16px;background:#fef2f2;border-radius:10px;border-left:4px solid #dc2626;">
            <p style="margin:0 0 4px;color:#991b1b;font-size:13px;font-weight:600;">Lý do từ chối:</p>
            <p style="margin:0;color:#7f1d1d;font-size:13px;line-height:1.6;">${booking.rejectionReason}</p>
          </div>`
        : ''
    }

    <div style="margin-top:16px;padding:16px;background:#fff7ed;border-radius:10px;border-left:4px solid #f97316;">
      <p style="margin:0;color:#7c2d12;font-size:13px;line-height:1.6;">
        💡 Bạn có thể đặt lại phòng với thời gian hoặc phòng khác phù hợp hơn.
      </p>
    </div>
  `;

  return layout({
    headerColor: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    icon: '❌',
    title: 'Lịch đặt phòng bị từ chối',
    bodyHtml: body,
  });
}

/**
 * Email sent to booker when their booking is cancelled.
 * @param {object} booking — includes room, user
 */
function bookingCancelled(booking) {
  const body = `
    <h2 style="margin:0 0 8px;color:#9333ea;font-size:20px;font-weight:700;">
      Lịch đặt phòng đã bị hủy
    </h2>
    <p style="margin:0 0 4px;color:#475569;font-size:14px;">
      Xin chào <strong>${booking.user?.fullName || 'bạn'}</strong>,
    </p>
    <p style="margin:0 0 20px;color:#475569;font-size:14px;">
      Lịch đặt phòng họp của bạn đã được hủy thành công. Chi tiết:
    </p>

    ${bookingTable(booking)}

    <div style="margin-top:24px;padding:16px;background:#faf5ff;border-radius:10px;border-left:4px solid #9333ea;">
      <p style="margin:0;color:#581c87;font-size:13px;line-height:1.6;">
        💡 Nếu bạn muốn đặt lại, hãy truy cập hệ thống và tạo yêu cầu mới.
      </p>
    </div>
  `;

  return layout({
    headerColor: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
    icon: '🚫',
    title: 'Lịch đặt phòng đã bị hủy',
    bodyHtml: body,
  });
}

/**
 * Email sent as a reminder 15 minutes before the meeting.
 * @param {object} booking — includes room, user
 */
function bookingReminder(booking) {
  const body = `
    <h2 style="margin:0 0 8px;color:#d97706;font-size:20px;font-weight:700;">
      Cuộc họp sắp bắt đầu!
    </h2>
    <p style="margin:0 0 4px;color:#475569;font-size:14px;">
      Xin chào <strong>${booking.user?.fullName || 'bạn'}</strong>,
    </p>
    <p style="margin:0 0 20px;color:#475569;font-size:14px;">
      Cuộc họp của bạn sẽ bắt đầu trong <strong style="color:#d97706;">15 phút nữa</strong>. Đừng quên!
    </p>

    ${bookingTable(booking)}

    <div style="margin-top:24px;padding:16px;background:#fffbeb;border-radius:10px;border-left:4px solid #d97706;">
      <p style="margin:0;color:#78350f;font-size:13px;line-height:1.6;">
        ⏰ <strong>Hãy chuẩn bị sẵn sàng</strong> và đến đúng giờ để đảm bảo cuộc họp diễn ra suôn sẻ.
      </p>
    </div>
  `;

  return layout({
    headerColor: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    icon: '⏰',
    title: `Nhắc lịch: ${booking.title}`,
    bodyHtml: body,
  });
}

/**
 * Email sent to all approvers when a new booking request is created.
 * @param {object} booking — includes room, user
 */
function newBookingForApprover(booking) {
  const body = `
    <h2 style="margin:0 0 8px;color:#2563eb;font-size:20px;font-weight:700;">
      Có yêu cầu đặt phòng mới cần duyệt
    </h2>
    <p style="margin:0 0 20px;color:#475569;font-size:14px;">
      Người dùng <strong>${booking.user?.fullName || 'Không rõ'}</strong>
      (<a href="mailto:${booking.user?.email}" style="color:#2563eb;">${booking.user?.email}</a>)
      vừa tạo một yêu cầu đặt phòng họp. Chi tiết:
    </p>

    ${bookingTable(booking)}

    <table style="width:100%;border-collapse:collapse;margin-top:8px;">
      ${row('👤 Người đặt', booking.user?.fullName)}
    </table>

    <div style="margin-top:24px;padding:16px;background:#eff6ff;border-radius:10px;border-left:4px solid #2563eb;">
      <p style="margin:0;color:#1e40af;font-size:13px;line-height:1.6;">
        🔔 Vui lòng đăng nhập vào hệ thống để <strong>duyệt hoặc từ chối</strong> yêu cầu này.
      </p>
    </div>
  `;

  return layout({
    headerColor: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    icon: '📋',
    title: 'Yêu cầu đặt phòng mới',
    bodyHtml: body,
  });
}

// ─── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  bookingApproved,
  bookingRejected,
  bookingCancelled,
  bookingReminder,
  newBookingForApprover,
};
