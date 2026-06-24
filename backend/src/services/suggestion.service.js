const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');

/**
 * Suggestion service — finds alternative rooms/slots and smart suggestions.
 */
const suggestionService = {
  /**
   * Get alternative rooms available during [startTime, endTime].
   * Ranks by:
   *  +10 — same location (contains match)
   *  +5  — capacity diff < 5
   *  +3  — each shared equipment item
   * Returns top 5 ranked rooms.
   *
   * @param {{ roomId: string, startTime: string, endTime: string, minCapacity?: string }} params
   */
  async getAlternativeRooms({ roomId, startTime, endTime, minCapacity }) {
    if (!roomId || !startTime || !endTime) {
      throw ApiError.badRequest('roomId, startTime và endTime là bắt buộc');
    }

    const start = new Date(startTime);
    const end   = new Date(endTime);
    if (isNaN(start) || isNaN(end) || end <= start) {
      throw ApiError.badRequest('Thời gian không hợp lệ');
    }

    // Get original room info
    const originalRoom = await prisma.room.findUnique({ where: { id: roomId } });
    if (!originalRoom) {
      throw ApiError.notFound('Room not found');
    }

    // Build availability filter
    const capacityFilter = minCapacity
      ? { gte: Number(minCapacity) }
      : undefined;

    // Find all active rooms that are NOT this room AND have no overlapping bookings
    const availableRooms = await prisma.room.findMany({
      where: {
        id: { not: roomId },
        isActive: true,
        ...(capacityFilter ? { capacity: capacityFilter } : {}),
        bookings: {
          none: {
            status: { in: ['pending', 'approved'] },
            startTime: { lt: end },
            endTime:   { gt: start },
          },
        },
      },
    });

    // Score each room
    const scored = availableRooms.map((room) => {
      let score = 0;

      // +10 for same location (simple substring match)
      if (
        originalRoom.location &&
        room.location &&
        room.location.toLowerCase().includes(
          originalRoom.location.split(/[,—\-\s]/)[0].trim().toLowerCase()
        )
      ) {
        score += 10;
      }

      // +5 for capacity close to original
      const capacityDiff = Math.abs(room.capacity - originalRoom.capacity);
      if (capacityDiff < 5) {
        score += 5;
      }

      // +3 for each shared equipment item
      if (originalRoom.equipment && room.equipment) {
        for (const eq of originalRoom.equipment) {
          if (room.equipment.includes(eq)) {
            score += 3;
          }
        }
      }

      return { ...room, score };
    });

    // Sort by score descending, take top 5
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 5);
  },

  /**
   * Get alternative time slots for the same room on a given date.
   * Finds free gaps of ≥30 minutes, sorted by proximity to preferredStartTime.
   * Returns top 5 slots.
   *
   * @param {{ roomId: string, date: string, preferredStartTime: string }} params
   */
  async getAlternativeSlots({ roomId, date, preferredStartTime }) {
    if (!roomId || !date) {
      throw ApiError.badRequest('roomId và date là bắt buộc');
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw ApiError.notFound('Room not found');
    }

    // Date range: from 07:00 to 22:00 local day
    const dayStart = new Date(`${date}T07:00:00`);
    const dayEnd   = new Date(`${date}T22:00:00`);

    // Get all pending/approved bookings for this room on this day
    const bookings = await prisma.booking.findMany({
      where: {
        roomId,
        status: { in: ['pending', 'approved'] },
        startTime: { lt: dayEnd },
        endTime:   { gt: dayStart },
      },
      orderBy: { startTime: 'asc' },
    });

    // Compute free gaps
    const gaps = [];
    let cursor = dayStart;

    for (const b of bookings) {
      const bStart = new Date(b.startTime);
      const bEnd   = new Date(b.endTime);

      // Clamp to day boundaries
      const gapStart = cursor > dayStart ? cursor : dayStart;
      const gapEnd   = bStart < dayEnd ? bStart : dayEnd;

      if (gapEnd > gapStart) {
        const durationMs = gapEnd - gapStart;
        if (durationMs >= 30 * 60 * 1000) {
          gaps.push({ start: gapStart, end: gapEnd });
        }
      }

      if (bEnd > cursor) cursor = bEnd;
    }

    // Final gap: cursor → dayEnd
    if (dayEnd > cursor) {
      const durationMs = dayEnd - cursor;
      if (durationMs >= 30 * 60 * 1000) {
        gaps.push({ start: cursor, end: dayEnd });
      }
    }

    // Format and sort by proximity to preferredStartTime
    const preferredMs = preferredStartTime
      ? new Date(`${date}T${preferredStartTime}`).getTime()
      : dayStart.getTime();

    const formatTime = (d) =>
      d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });

    const slots = gaps.map((g) => ({
      startTime: g.start.toISOString(),
      endTime:   g.end.toISOString(),
      startLabel: formatTime(g.start),
      endLabel:   formatTime(g.end),
      distance: Math.abs(g.start.getTime() - preferredMs),
    }));

    slots.sort((a, b) => a.distance - b.distance);

    return slots.slice(0, 5).map(({ distance: _d, ...slot }) => slot);
  },

  /**
   * Smart suggestions based on user booking history.
   * Analyzes top rooms + time slots from last 30 approved bookings,
   * then checks if those combos are available next week.
   *
   * @param {string} userId
   */
  async getSmartSuggestions(userId) {
    // Last 30 approved bookings
    const recentBookings = await prisma.booking.findMany({
      where: { userId, status: 'approved' },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        room: { select: { id: true, name: true, location: true, capacity: true, equipment: true } },
      },
    });

    if (recentBookings.length === 0) {
      return [];
    }

    // Count room frequency
    const roomCount = {};
    for (const b of recentBookings) {
      roomCount[b.roomId] = (roomCount[b.roomId] || 0) + 1;
    }

    // Count (hour:minute) frequency
    const timeCount = {};
    for (const b of recentBookings) {
      const st   = new Date(b.startTime);
      const et   = new Date(b.endTime);
      const hhmm = `${String(st.getHours()).padStart(2, '0')}:${String(st.getMinutes()).padStart(2, '0')}`;
      const dur  = Math.round((et - st) / 60000); // duration in minutes
      const key  = `${hhmm}:${dur}`;
      timeCount[key] = (timeCount[key] || 0) + 1;
    }

    // Top 3 rooms
    const topRooms = Object.entries(roomCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);

    // Top 3 time slots (hhmm:duration)
    const topTimes = Object.entries(timeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key]) => {
        const [h, m, dur] = key.split(':');
        return { hour: parseInt(h), minute: parseInt(m), duration: parseInt(dur) };
      });

    // Most common weekday
    const dayCount = {};
    for (const b of recentBookings) {
      const day = new Date(b.startTime).getDay(); // 0=Sun .. 6=Sat
      dayCount[day] = (dayCount[day] || 0) + 1;
    }
    const topDay = parseInt(
      Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '1'
    );

    // Build suggestions: for each top room × top time slot, check next week
    const suggestions = [];
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

    // Find next occurrence of topDay (next week)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilTarget = ((topDay - today.getDay()) + 7) % 7 || 7;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);

    for (const roomId of topRooms) {
      const bookingRoom = recentBookings.find((b) => b.roomId === roomId)?.room;
      if (!bookingRoom) continue;

      for (const timeSlot of topTimes) {
        const startTime = new Date(targetDate);
        startTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
        const endTime = new Date(startTime.getTime() + timeSlot.duration * 60000);

        // Check availability
        const conflicts = await prisma.booking.count({
          where: {
            roomId,
            status: { in: ['pending', 'approved'] },
            startTime: { lt: endTime },
            endTime:   { gt: startTime },
          },
        });

        const available = conflicts === 0;
        const startLabel = `${String(timeSlot.hour).padStart(2, '0')}:${String(timeSlot.minute).padStart(2, '0')}`;
        const endH = Math.floor((timeSlot.hour * 60 + timeSlot.minute + timeSlot.duration) / 60);
        const endM = (timeSlot.hour * 60 + timeSlot.minute + timeSlot.duration) % 60;
        const endLabel = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

        suggestions.push({
          message: `Bạn thường họp ${dayNames[topDay]} lúc ${startLabel} ở ${bookingRoom.name}`,
          room: bookingRoom,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          startLabel,
          endLabel,
          dayLabel: dayNames[topDay],
          available,
        });
      }
    }

    // Return unique available suggestions first, max 5
    const unique = [];
    const seen = new Set();
    for (const s of suggestions) {
      const key = `${s.room.id}:${s.startLabel}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(s);
      }
      if (unique.length >= 5) break;
    }

    return unique;
  },
};

module.exports = suggestionService;
