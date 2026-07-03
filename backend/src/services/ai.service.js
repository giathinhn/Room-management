/**
 * ai.service.js — AI Chatbot business logic (Plan 16)
 *
 * Orchestrates:
 * 1. Save user message to DB
 * 2. Load chat history + room context
 * 3. Call Gemini API
 * 4. Execute DB action based on parsed intent
 * 5. Save AI response to DB
 * 6. Return enriched response to controller
 */

const prisma = require('../config/database');
const { callGemini } = require('../utils/gemini');
const bookingService = require('./booking.service');
const logger = require('../utils/logger');

// ─── System Prompt Builder ───────────────────────────────────────────────────

/**
 * Build the system prompt for Gemini, injecting:
 * - Current date/time (Vietnam timezone)
 * - Room list from DB
 */
async function buildSystemPrompt() {
  // Current date/time in Vietnam timezone
  const now = new Date();
  const vnOptions = { timeZone: 'Asia/Ho_Chi_Minh' };
  const currentDate = now.toLocaleDateString('vi-VN', { ...vnOptions, dateStyle: 'full' });
  const currentTime = now.toLocaleTimeString('vi-VN', { ...vnOptions, timeStyle: 'short' });
  const isoDate = now.toLocaleDateString('en-CA', vnOptions); // YYYY-MM-DD

  // Load all active rooms
  const rooms = await prisma.room.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, capacity: true, location: true, equipment: true },
  });

  const roomList = rooms
    .map(
      (r) =>
        `- ${r.name} (ID: ${r.id}): sức chứa ${r.capacity} người, vị trí: ${r.location}` +
        (r.equipment.length > 0 ? `, thiết bị: ${r.equipment.join(', ')}` : '')
    )
    .join('\n');

  return `Bạn là RoomSync AI — trợ lý đặt phòng họp thông minh cho hệ thống RoomSync.

📅 Hôm nay: ${currentDate} (${isoDate})
🕐 Giờ hiện tại: ${currentTime} (UTC+7, Asia/Ho_Chi_Minh)

🏢 Danh sách phòng họp hiện có:
${roomList || '(Chưa có phòng nào)'}

📋 Quy tắc đặt phòng:
- Giờ hành chính: 07:00 – 22:00
- Thời lượng tối thiểu: 30 phút, tối đa: 8 giờ
- Đặt trước tối đa: 30 ngày
- Không thể đặt trong quá khứ

🎯 Hướng dẫn xử lý theo action:
1. "chat": Câu hỏi thông thường, hỏi thêm thông tin, giải thích quy tắc. Chỉ dùng khi trò chuyện phiếm hoặc khi thiếu thông tin cơ bản (ngày, giờ, số người) mà không thể tìm phòng.
2. "query_rooms": BẮT BUỘC chọn khi người dùng muốn đặt phòng hoặc tìm phòng trống (ví dụ: "đặt phòng ngày mai 9h", "tìm phòng 5 người"). Bạn phải trích xuất các tham số (date, startTime, capacity) để hệ thống tự động tìm phòng trống và hiển thị dạng thẻ phòng. KHÔNG được hỏi thêm tiêu đề hay thông tin khác trước khi hiển thị phòng trống.
3. "propose_booking": Khi đã xác định được phòng họp cụ thể (ví dụ user chọn phòng hoặc gõ "đặt phòng Pearl") -> BẮT BUỘC chọn action này để đề xuất đặt phòng và hiển thị thẻ xác nhận. Tự động lấy ngày/giờ từ lịch sử chat.
4. "list_bookings": Khi user hỏi lịch của họ (hôm nay, tuần này, v.v.)
5. "cancel_booking": Khi user muốn hủy một booking (cần bookingTitle hoặc bookingId)
6. "check_availability": Kiểm tra một phòng cụ thể có trống không

📌 Lưu ý quan trọng:
- Trả lời bằng ngôn ngữ của người dùng (Tiếng Việt hoặc English)
- Nếu thiếu thông tin cơ bản (ngày, giờ, số người) → hỏi lại, dùng action "chat".
- Khi đề xuất giờ kết thúc: nếu user không nêu → dự kiến 1 giờ sau giờ bắt đầu.
- Nếu thiếu tiêu đề cuộc họp → tự đặt tiêu đề mặc định ngắn gọn (ví dụ: "Họp tại [Tên phòng]" hoặc "Họp team").
- Trả lời cực kỳ NGẮN GỌN (tối đa 2 câu).
- Tuyệt đối không lặp lại danh sách phòng họp hoặc các thông tin thiết bị chi tiết khi đề xuất đặt phòng (propose_booking) hoặc xác nhận (confirm_booking).
- Không tự ý tạo booking — chỉ đề xuất (propose_booking), để user xác nhận`;
}

// ─── Chat History ────────────────────────────────────────────────────────────

async function loadHistory(userId, limit = 20) {
  const msgs = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: { id: true, role: true, content: true, metadata: true, createdAt: true },
  });
  return msgs;
}

async function saveMessage(userId, role, content, metadata = null) {
  return prisma.chatMessage.create({
    data: {
      userId,
      role,
      content,
      metadata: metadata || undefined,
    },
  });
}

// ─── Action Handlers ─────────────────────────────────────────────────────────

/**
 * Find available rooms matching the given parameters.
 */
async function handleQueryRooms(params) {
  const { date, startTime, endTime, durationMinutes, capacity, equipment, location } = params || {};

  if (!date || !startTime) {
    return { rooms: [] };
  }

  // Resolve endTime
  let resolvedEnd = endTime;
  if (!resolvedEnd && durationMinutes) {
    const [h, m] = startTime.split(':').map(Number);
    const totalMin = h * 60 + m + durationMinutes;
    resolvedEnd = `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
  } else if (!resolvedEnd) {
    // Default 1 hour
    const [h, m] = startTime.split(':').map(Number);
    const totalMin = h * 60 + m + 60;
    resolvedEnd = `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
  }

  const start = new Date(`${date}T${startTime}:00`);
  const end = new Date(`${date}T${resolvedEnd}:00`);

  if (isNaN(start) || isNaN(end) || end <= start) {
    return { rooms: [] };
  }

  // Build filters
  const where = {
    isActive: true,
    bookings: {
      none: {
        status: { in: ['pending', 'approved'] },
        startTime: { lt: end },
        endTime: { gt: start },
      },
    },
  };

  if (capacity) where.capacity = { gte: Number(capacity) };
  if (location) where.location = { contains: location, mode: 'insensitive' };
  if (equipment && equipment.length > 0) {
    where.equipment = { hasEvery: equipment };
  }

  const rooms = await prisma.room.findMany({
    where,
    orderBy: { capacity: 'asc' },
  });

  return { rooms, resolvedDate: date, resolvedStartTime: startTime, resolvedEndTime: resolvedEnd };
}

/**
 * Get user's bookings for listing.
 */
async function handleListBookings(userId, params) {
  const { date } = params || {};

  const where = { userId };

  if (date) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59`);
    where.startTime = { gte: start, lte: end };
  } else {
    // Default: upcoming bookings (next 7 days)
    const now = new Date();
    const next7 = new Date(now);
    next7.setDate(next7.getDate() + 7);
    where.startTime = { gte: now, lte: next7 };
    where.status = { in: ['pending', 'approved'] };
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { startTime: 'asc' },
    take: 10,
    include: {
      room: { select: { id: true, name: true, location: true } },
    },
  });

  return { bookings };
}

/**
 * Cancel a booking identified by title or id.
 */
async function handleCancelBooking(userId, userRole, params) {
  const { bookingId, bookingTitle } = params || {};

  let booking = null;

  if (bookingId) {
    booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: { select: { name: true } } },
    });
  } else if (bookingTitle) {
    // Find by title (case-insensitive, owned by user, cancellable status)
    const matches = await prisma.booking.findMany({
      where: {
        userId,
        title: { contains: bookingTitle, mode: 'insensitive' },
        status: { in: ['pending', 'approved'] },
      },
      include: { room: { select: { name: true } } },
      orderBy: { startTime: 'asc' },
      take: 5,
    });

    if (matches.length === 0) {
      return {
        success: false,
        reply: `Không tìm thấy booking "${bookingTitle}" nào đang chờ duyệt hoặc đã duyệt.`,
      };
    }
    if (matches.length > 1) {
      return {
        success: false,
        bookings: matches,
        reply: `Tìm thấy ${matches.length} booking có tên tương tự. Bạn muốn hủy booking nào?`,
      };
    }
    booking = matches[0];
  }

  if (!booking) {
    return { success: false, reply: 'Không tìm thấy booking. Vui lòng cung cấp thêm thông tin.' };
  }

  if (!['pending', 'approved'].includes(booking.status)) {
    return {
      success: false,
      reply: `Booking "${booking.title}" đang ở trạng thái ${booking.status} và không thể hủy.`,
    };
  }

  // Use bookingService to cancel (handles auth + notifications)
  const cancelled = await bookingService.cancel(booking.id, { id: userId, role: userRole });
  return { success: true, booking: cancelled };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

const aiService = {
  /**
   * Process a user chat message:
   * 1. Save user message
   * 2. Load history + build context
   * 3. Call Gemini
   * 4. Execute action
   * 5. Save AI message
   * 6. Return response
   *
   * @param {string} userId
   * @param {string} userRole
   * @param {string} message
   */
  async processMessage(userId, userRole, message) {
    // 1. Save user message
    await saveMessage(userId, 'user', message);

    // 2. Load history (for Gemini context) and build system prompt
    const [historyRows, systemPrompt] = await Promise.all([
      loadHistory(userId, 20),
      buildSystemPrompt(),
    ]);

    // Convert DB history to Gemini format (exclude the message we just saved = last item)
    const historyForGemini = historyRows
      .slice(0, -1) // exclude last (just-saved user message)
      .map((m) => ({ role: m.role, content: m.content }));

    // 3. Call Gemini
    let geminiResponse;
    try {
      geminiResponse = await callGemini(historyForGemini, message, systemPrompt);
    } catch (err) {
      logger.error('[AIService] Gemini call failed:', err.message);
      const errorReply = 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau vài giây!';
      await saveMessage(userId, 'assistant', errorReply);
      return { reply: errorReply, action: 'chat' };
    }

    const { reply, action, parameters } = geminiResponse;

    // 4. Execute action
    let extraData = {};
    let finalReply = reply;

    // Merge parameters with context from history (in case LLM omitted them in this turn)
    const mergedParameters = { ...parameters };
    if (['propose_booking', 'confirm_booking'].includes(action)) {
      for (let i = historyRows.length - 2; i >= 0; i--) {
        const prevMeta = historyRows[i].metadata;
        if (prevMeta && prevMeta.parameters) {
          const prevParams = prevMeta.parameters;
          if (!mergedParameters.roomId && prevParams.roomId) mergedParameters.roomId = prevParams.roomId;
          if (!mergedParameters.roomName && prevParams.roomName) mergedParameters.roomName = prevParams.roomName;
          if (!mergedParameters.date && prevParams.date) mergedParameters.date = prevParams.date;
          if (!mergedParameters.startTime && prevParams.startTime) mergedParameters.startTime = prevParams.startTime;
          if (!mergedParameters.endTime && prevParams.endTime) mergedParameters.endTime = prevParams.endTime;
          if (!mergedParameters.title && prevParams.title) mergedParameters.title = prevParams.title;
          if (!mergedParameters.capacity && prevParams.capacity) mergedParameters.capacity = prevParams.capacity;
        }
      }
    }

    // Resolve roomId by roomName if roomId is missing but name is available
    if (!mergedParameters.roomId && mergedParameters.roomName) {
      const room = await prisma.room.findFirst({
        where: { name: { equals: mergedParameters.roomName, mode: 'insensitive' } }
      });
      if (room) {
        mergedParameters.roomId = room.id;
      }
    }

    try {
      switch (action) {
        case 'query_rooms': {
          const result = await handleQueryRooms(mergedParameters);
          extraData = result;
          break;
        }

        case 'propose_booking': {
          // Build a proposal object for the frontend to confirm
          const { roomId, roomName, title, date, startTime, endTime, durationMinutes } =
            mergedParameters || {};

          let resolvedEnd = endTime;
          if (!resolvedEnd && startTime && durationMinutes) {
            const [h, m] = startTime.split(':').map(Number);
            const totalMin = h * 60 + m + durationMinutes;
            resolvedEnd = `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
          } else if (!resolvedEnd && startTime) {
            const [h, m] = startTime.split(':').map(Number);
            const totalMin = h * 60 + m + 60;
            resolvedEnd = `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
          }

          if (roomId && date && startTime) {
            extraData.proposal = {
              roomId,
              roomName: roomName || 'Phòng họp',
              title: title || 'Cuộc họp',
              startTime: `${date}T${startTime}:00`,
              endTime: `${date}T${resolvedEnd}:00`,
            };
          }
          break;
        }

        case 'confirm_booking': {
          // Rarely triggered from AI; typically handled client-side via BookingProposalCard
          const { roomId, title, date, startTime, endTime } = mergedParameters || {};
          
          let resolvedEnd = endTime;
          if (!resolvedEnd && startTime) {
            const [h, m] = startTime.split(':').map(Number);
            const totalMin = h * 60 + m + 60; // default 1 hour
            resolvedEnd = `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
          }

          if (roomId && date && startTime && resolvedEnd) {
            try {
              const booking = await bookingService.create(userId, {
                roomId,
                title: title || 'Cuộc họp',
                startTime: `${date}T${startTime}:00`,
                endTime: `${date}T${resolvedEnd}:00`,
              });
              extraData.booking = booking;
              // Override reply for successful confirmation
              finalReply = `🎉 **Đặt phòng thành công!**\n\nCuộc họp **${booking.title}** tại **${booking.room?.name}** đã được tạo và đang chờ duyệt.\n\n${reply}`;
            } catch (bookErr) {
              // Return error in reply
              const errReply = bookErr.message || 'Không thể đặt phòng. Vui lòng thử lại.';
              await saveMessage(userId, 'assistant', errReply);
              return { reply: errReply, action };
            }
          } else {
            // Missing parameters
            const missing = [];
            if (!roomId) missing.push('phòng họp');
            if (!date) missing.push('ngày');
            if (!startTime) missing.push('giờ bắt đầu');
            if (!resolvedEnd) missing.push('giờ kết thúc');
            const errReply = `⚠️ **Không thể đặt phòng:** Thiếu thông tin ${missing.join(', ')}. Vui lòng click chọn phòng trống trên thẻ gợi ý trước khi xác nhận.`;
            await saveMessage(userId, 'assistant', errReply);
            return { reply: errReply, action: 'chat' };
          }
          break;
        }

        case 'list_bookings': {
          const result = await handleListBookings(userId, mergedParameters);
          extraData = result;
          break;
        }

        case 'cancel_booking': {
          const result = await handleCancelBooking(userId, userRole, mergedParameters);
          if (!result.success && result.reply) {
            // Override AI reply with more specific message
            await saveMessage(userId, 'assistant', result.reply, { action, ...result });
            return { reply: result.reply, action, bookings: result.bookings };
          }
          extraData = result;
          break;
        }

        case 'check_availability': {
          const { roomId, date, startTime, endTime } = mergedParameters || {};
          if (roomId && date && startTime && endTime) {
            const start = new Date(`${date}T${startTime}:00`);
            const end = new Date(`${date}T${endTime}:00`);
            const conflicts = await prisma.booking.findMany({
              where: {
                roomId,
                status: { in: ['pending', 'approved'] },
                startTime: { lt: end },
                endTime: { gt: start },
              },
              take: 5,
            });
            extraData.available = conflicts.length === 0;
            extraData.conflicts = conflicts;
          }
          break;
        }

        default:
          // 'chat' — no extra DB calls needed
          break;
      }
    } catch (actionErr) {
      logger.error(`[AIService] Action ${action} failed:`, actionErr.message);
      // Non-fatal: still return the AI's text reply
    }

    // 5. Save AI message with metadata
    await saveMessage(userId, 'assistant', finalReply, { action, parameters: mergedParameters, ...extraData });

    // 6. Return response
    return { reply: finalReply, action, ...extraData };
  },

  /**
   * Get chat history for a user.
   * @param {string} userId
   * @param {number} limit
   */
  async getHistory(userId, limit = 50) {
    return prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: { id: true, role: true, content: true, metadata: true, createdAt: true },
    });
  },

  /**
   * Clear all chat messages for a user.
   * @param {string} userId
   */
  async clearHistory(userId) {
    await prisma.chatMessage.deleteMany({ where: { userId } });
  },
};

module.exports = aiService;
