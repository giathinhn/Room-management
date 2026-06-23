const ExcelJS = require('exceljs');
const prisma = require('../config/database');

/**
 * Map status value to Vietnamese label and color.
 */
const STATUS_META = {
  pending:   { label: 'Chờ duyệt', fgColor: 'FFAA00', bgColor: 'FFF3CD' },
  approved:  { label: 'Đã duyệt',  fgColor: '1A6B2A', bgColor: 'D4EDDA' },
  rejected:  { label: 'Từ chối',   fgColor: '842029', bgColor: 'F8D7DA' },
  cancelled: { label: 'Đã hủy',    fgColor: '495057', bgColor: 'E2E3E5' },
};

/**
 * Pad a number to 2 digits.
 * @param {number} n
 */
const pad = (n) => String(n).padStart(2, '0');

/**
 * Format a Date to dd/MM/yyyy
 * @param {Date} d
 */
const fmtDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
};

/**
 * Format a Date to HH:mm
 * @param {Date} d
 */
const fmtTime = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

/**
 * Format a Date to dd/MM/yyyy HH:mm
 * @param {Date} d
 */
const fmtDatetime = (d) => {
  if (!d) return '';
  return `${fmtDate(d)} ${fmtTime(d)}`;
};

/**
 * Calculate duration in minutes between two dates.
 * @param {Date} start
 * @param {Date} end
 */
const durationMinutes = (start, end) => {
  const diffMs = new Date(end) - new Date(start);
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}g ${m}p` : `${h} giờ`;
};

/**
 * Fetch bookings from DB without pagination.
 * @param {{ roomId?, status?, startDate?, endDate?, userId? }} filters
 */
async function fetchAllBookings({ roomId, status, startDate, endDate, userId } = {}) {
  const where = {};

  if (roomId)  where.roomId = roomId;
  if (userId)  where.userId = userId;
  if (status)  where.status = status;

  if (startDate || endDate) {
    where.startTime = {};
    if (startDate) where.startTime.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.startTime.lte = end;
    }
  }

  return prisma.booking.findMany({
    where,
    orderBy: { startTime: 'asc' },
    include: {
      room:     { select: { id: true, name: true, location: true } },
      user:     { select: { id: true, fullName: true, email: true } },
      approver: { select: { id: true, fullName: true } },
    },
  });
}

/**
 * Build and return an Excel workbook buffer for the given booking filters.
 *
 * @param {{ roomId?, status?, startDate?, endDate?, userId? }} filters
 * @returns {Promise<Buffer>}
 */
async function exportBookingsToExcel(filters = {}) {
  const bookings = await fetchAllBookings(filters);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Room Management System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Danh sách đặt phòng', {
    pageSetup: { orientation: 'landscape', fitToPage: true },
  });

  // ── Column definitions ──────────────────────────────────────────────────────
  sheet.columns = [
    { key: 'stt',       width: 6  },
    { key: 'title',     width: 30 },
    { key: 'room',      width: 22 },
    { key: 'booker',    width: 22 },
    { key: 'email',     width: 28 },
    { key: 'date',      width: 14 },
    { key: 'startTime', width: 12 },
    { key: 'endTime',   width: 12 },
    { key: 'duration',  width: 12 },
    { key: 'status',    width: 14 },
    { key: 'approver',  width: 22 },
    { key: 'createdAt', width: 18 },
  ];

  // ── Merge & title row ───────────────────────────────────────────────────────
  sheet.mergeCells('A1:L1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'BÁO CÁO LỊCH ĐẶT PHÒNG HỌP';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3730A3' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 36;

  // ── Subtitle row ────────────────────────────────────────────────────────────
  sheet.mergeCells('A2:L2');
  const subtitleCell = sheet.getCell('A2');
  const fromStr = filters.startDate ? fmtDate(new Date(filters.startDate)) : '—';
  const toStr   = filters.endDate   ? fmtDate(new Date(filters.endDate))   : '—';
  subtitleCell.value = `Từ ngày ${fromStr} đến ngày ${toStr}`;
  subtitleCell.font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF6366F1' } };
  subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 22;

  // ── Header row ──────────────────────────────────────────────────────────────
  const HEADER_LABELS = [
    'STT', 'Tiêu đề cuộc họp', 'Phòng', 'Người đặt', 'Email',
    'Ngày', 'Giờ bắt đầu', 'Giờ kết thúc', 'Thời lượng',
    'Trạng thái', 'Người duyệt', 'Ngày tạo',
  ];

  const headerRow = sheet.getRow(3);
  headerRow.height = 24;
  HEADER_LABELS.forEach((label, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = label;
    cell.font  = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top:    { style: 'thin', color: { argb: 'FF3730A3' } },
      bottom: { style: 'thin', color: { argb: 'FF3730A3' } },
      left:   { style: 'thin', color: { argb: 'FF3730A3' } },
      right:  { style: 'thin', color: { argb: 'FF3730A3' } },
    };
  });

  // ── Data rows ───────────────────────────────────────────────────────────────
  bookings.forEach((booking, idx) => {
    const meta   = STATUS_META[booking.status] || STATUS_META.pending;
    const rowNum = idx + 4; // rows 1-3 are title/subtitle/header
    const row    = sheet.getRow(rowNum);
    row.height = 20;

    const values = [
      idx + 1,
      booking.title,
      booking.room?.name || '—',
      booking.user?.fullName || '—',
      booking.user?.email || '—',
      fmtDate(booking.startTime),
      fmtTime(booking.startTime),
      fmtTime(booking.endTime),
      durationMinutes(booking.startTime, booking.endTime),
      meta.label,
      booking.approver?.fullName || '—',
      fmtDatetime(booking.createdAt),
    ];

    values.forEach((value, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.value = value;
      cell.font  = { name: 'Calibri', size: 10 };
      cell.alignment = { vertical: 'middle', wrapText: false };

      // Zebra stripe
      const stripeFill = idx % 2 === 0
        ? 'FFFAFAFA'
        : 'FFF1F5F9';

      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: stripeFill } };

      // Color-code status column (index 9 → column J)
      if (colIdx === 9) {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: `FF${meta.fgColor}` } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${meta.bgColor}` } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // Center STT column
      if (colIdx === 0) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // Center date/time columns
      if ([5, 6, 7, 8].includes(colIdx)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      cell.border = {
        top:    { style: 'hair', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'hair', color: { argb: 'FFD1D5DB' } },
        left:   { style: 'hair', color: { argb: 'FFD1D5DB' } },
        right:  { style: 'hair', color: { argb: 'FFD1D5DB' } },
      };
    });
  });

  // ── Footer row ──────────────────────────────────────────────────────────────
  const footerRowNum = bookings.length + 4;
  sheet.mergeCells(`A${footerRowNum}:L${footerRowNum}`);
  const footerCell = sheet.getCell(`A${footerRowNum}`);
  footerCell.value = `Xuất lúc: ${fmtDatetime(new Date())}  —  Tổng: ${bookings.length} bản ghi`;
  footerCell.font  = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF6B7280' } };
  footerCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
  footerCell.alignment = { horizontal: 'right', vertical: 'middle' };
  sheet.getRow(footerRowNum).height = 18;

  // ── Freeze header pane ──────────────────────────────────────────────────────
  sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 3, activeCell: 'A4' }];

  // ── Auto filter on header row ───────────────────────────────────────────────
  sheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: 12 } };

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = { exportBookingsToExcel };
