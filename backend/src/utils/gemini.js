/**
 * gemini.js — Google Gemini API utility (Plan 16: AI Chatbot)
 *
 * Calls Gemini REST API using native Node.js fetch (Node 18+).
 * No additional packages required.
 *
 * Endpoint: POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 */

const env = require('../config/env');
const logger = require('./logger');

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Structured JSON response schema for Gemini.
 * Forces the model to always return a valid JSON matching this shape.
 */
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    reply: {
      type: 'STRING',
      description: 'Tin nhắn trả lời hiển thị cho người dùng. Hỗ trợ markdown đơn giản (**bold**).',
    },
    action: {
      type: 'STRING',
      enum: [
        'chat',
        'query_rooms',
        'propose_booking',
        'confirm_booking',
        'list_bookings',
        'cancel_booking',
        'check_availability',
      ],
      description: 'Hành động cần thực thi dựa trên ý định của người dùng.',
    },
    parameters: {
      type: 'OBJECT',
      description: 'Các tham số được trích xuất từ tin nhắn của người dùng.',
      properties: {
        date: {
          type: 'STRING',
          description: 'Ngày đặt phòng, định dạng YYYY-MM-DD. Ví dụ: 2026-07-03',
        },
        startTime: {
          type: 'STRING',
          description: 'Giờ bắt đầu, định dạng HH:mm. Ví dụ: 09:00',
        },
        endTime: {
          type: 'STRING',
          description: 'Giờ kết thúc, định dạng HH:mm. Ví dụ: 10:00',
        },
        durationMinutes: {
          type: 'INTEGER',
          description: 'Thời lượng cuộc họp tính bằng phút (dùng khi user nói "1 tiếng", "30 phút")',
        },
        capacity: {
          type: 'INTEGER',
          description: 'Số người tham dự',
        },
        equipment: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Danh sách thiết bị cần có: máy chiếu, micro, bảng trắng, TV, webcam, loa, điều hòa',
        },
        location: {
          type: 'STRING',
          description: 'Vị trí/tầng/tòa nhà ưu tiên',
        },
        title: {
          type: 'STRING',
          description: 'Tiêu đề/mục đích cuộc họp',
        },
        roomId: {
          type: 'STRING',
          description: 'UUID của phòng được chọn',
        },
        roomName: {
          type: 'STRING',
          description: 'Tên phòng (dùng khi user đề cập tên phòng cụ thể)',
        },
        bookingId: {
          type: 'STRING',
          description: 'UUID của booking cần thao tác (hủy, kiểm tra)',
        },
        bookingTitle: {
          type: 'STRING',
          description: 'Tiêu đề booking cần thao tác (khi user nêu tên booking)',
        },
      },
    },
  },
  required: ['reply', 'action'],
};

/**
 * Call Gemini generateContent endpoint with structured JSON output.
 *
 * @param {Array<{role: 'user'|'model', content: string}>} history - Previous messages
 * @param {string} userMessage - New user message
 * @param {string} systemPrompt - System instruction text
 * @returns {Promise<{reply: string, action: string, parameters?: object}>}
 */
async function callGemini(history, userMessage, systemPrompt) {
  const apiKey = env.GEMINI_API_KEY;
  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    return {
      reply:
        '⚠️ AI Chatbot chưa được cấu hình. Vui lòng liên hệ admin để thêm GEMINI_API_KEY vào file .env.',
      action: 'chat',
    };
  }

  // Build conversation contents (Gemini format: 'user' / 'model')
  const contents = [];

  // Add history (limit to last 20 messages to stay within token budget)
  const recentHistory = history.slice(-20);
  for (const msg of recentHistory) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }

  // Add current user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      response_mime_type: 'application/json',
      response_schema: RESPONSE_SCHEMA,
      temperature: 0.7,
      max_output_tokens: 2048,
    },
  };

  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  let maxRetries = 3;
  let delayMs = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errStatus = response.status;
        logger.error(`[Gemini] API error ${errStatus} (Attempt ${attempt}/${maxRetries}): ${errorText}`);

        if ((errStatus === 429 || errStatus === 503 || errStatus === 500) && attempt < maxRetries) {
          logger.warn(`[Gemini] Temporary error ${errStatus}. Retrying in ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          delayMs *= 2;
          continue;
        }

        throw new Error(`Gemini API returned ${errStatus}: ${errorText}`);
      }

      const data = await response.json();

      let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Gemini returned empty response');
      }

      // Safe clean markdown codeblock wrappers
      rawText = rawText.trim();
      if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      }

      const parsed = JSON.parse(rawText);
      return parsed;

    } catch (err) {
      if (attempt === maxRetries) {
        logger.error(`[Gemini] Final attempt failed: ${err.message}`);
        throw err;
      }
      logger.warn(`[Gemini] Attempt ${attempt} failed: ${err.message}. Retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 2;
    }
  }
}

module.exports = { callGemini };
