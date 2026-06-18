/**
 * recurring.js — Utility to generate recurring booking slots.
 *
 * generateSlots(startDate, endDate, startTime, endTime, frequency)
 *
 * @param {string} startDate  — 'YYYY-MM-DD'
 * @param {string} endDate    — 'YYYY-MM-DD'
 * @param {string} startTime  — 'HH:mm'
 * @param {string} endTime    — 'HH:mm'
 * @param {string} frequency  — 'daily' | 'weekly' | 'monthly'
 *
 * @returns {Array<{ startTime: Date, endTime: Date }>}
 */
function generateSlots(startDate, endDate, startTime, endTime, frequency) {
  const MAX_SLOTS = 52;
  const slots = [];

  // Parse date + time → full Date object (local time as ISO string)
  function buildDateTime(dateStr, timeStr) {
    return new Date(`${dateStr}T${timeStr}:00`);
  }

  // Advance a date by one step of the given frequency.
  // Handles monthly edge case (e.g., Jan 31 + 1 month → Feb 28/29).
  function advanceDate(date, freq) {
    const d = new Date(date);
    if (freq === 'daily') {
      d.setDate(d.getDate() + 1);
    } else if (freq === 'weekly') {
      d.setDate(d.getDate() + 7);
    } else if (freq === 'monthly') {
      const originalDay = d.getDate();
      d.setMonth(d.getMonth() + 1);
      // If the month overflowed (e.g. Jan 31 → Mar 2), clamp to last day of target month
      if (d.getDate() !== originalDay) {
        d.setDate(0); // last day of the previous (target) month
      }
    }
    return d;
  }

  const endDateObj = new Date(`${endDate}T23:59:59`);
  const now = new Date();

  let current = new Date(`${startDate}T00:00:00`);

  while (current <= endDateObj && slots.length < MAX_SLOTS) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    const currentDateStr = `${yyyy}-${mm}-${dd}`;

    const slotStart = buildDateTime(currentDateStr, startTime);
    const slotEnd = buildDateTime(currentDateStr, endTime);

    // Skip slots in the past (using current time as reference)
    if (slotEnd > now) {
      slots.push({
        date: currentDateStr,
        startTime: slotStart,
        endTime: slotEnd,
      });
    }

    current = advanceDate(current, frequency);
  }

  return slots;
}

module.exports = { generateSlots };
