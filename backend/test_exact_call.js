const { PrismaClient } = require('@prisma/client');
const { callGemini } = require('./src/utils/gemini');

async function main() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst({ where: { email: 'admin@company.com' } });
  
  // Load history
  const historyRows = await prisma.chatMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  });

  // We want to test the call with 'ok'
  // The history should be all messages before 'ok' (the 5th user message in the DB)
  // Let's filter out the last error message from the DB.
  
  const history = historyRows
    .slice(0, -1) // Exclude the last error assistant message
    .slice(0, -1) // Exclude the 'ok' user message
    .map(m => ({ role: m.role, content: m.content }));
    
  const userMessage = 'ok';

  console.log('History:', JSON.stringify(history, null, 2));
  console.log('User Message:', userMessage);

  const systemPrompt = `Bạn là RoomSync AI — trợ lý đặt phòng họp thông minh cho hệ thống RoomSync.
📅 Hôm nay: Thứ Năm, ngày 2 tháng 7 năm 2026 (2026-07-02)
🕐 Giờ hiện tại: 15:03 (UTC+7, Asia/Ho_Chi_Minh)

🏢 Danh sách phòng họp hiện có:
- Phòng brainstorm Pearl (ID: 684c466a-21a1-48d9-8401-121d680b289b): sức chứa 8 người, vị trí: Tầng 4, Tòa A, thiết bị: Bảng trắng lớn, Post-it boards, TV 65", Điều hòa, Ghế bean bag
- Phòng họp Sapphire (ID: cac86d38-a6e1-43ab-8c80-6ca09128e2ce): sức chứa 12 người, vị trí: Tầng 3, Tòa A, thiết bị: Máy chiếu 4K, Video conference, Bảng trắng, Điều hòa, Mini bar
- Hội trường Diamond (ID: 65f4b4f0-6f37-4d25-9cd4-b03d548a1ba9): sức chứa 30 người, vị trí: Tầng 1, Tòa A, thiết bị: Máy chiếu laser, Hệ thống âm thanh, Micro không dây, Video conference, Điều hòa trung tâm, Bảng trắng điện tử

📋 Quy tắc đặt phòng:
- Giờ hành chính: 07:00 – 22:00
- Thời lượng tối thiểu: 30 phút, tối đa: 8 giờ
- Đặt trước tối đa: 30 ngày
- Không thể đặt trong quá khứ

🎯 Hướng dẫn xử lý theo action:
1. "chat": Câu hỏi thông thường, hỏi thêm thông tin, giải thích quy tắc
2. "query_rooms": Khi user muốn tìm phòng (extract date, startTime, endTime, capacity, equipment)
3. "propose_booking": Khi đã biết phòng cụ thể — đề xuất booking với đầy đủ thông tin (roomId, title, date, startTime, endTime)
4. "list_bookings": Khi user hỏi lịch của họ (hôm nay, tuần này, v.v.)
5. "cancel_booking": Khi user muốn hủy một booking (cần bookingTitle hoặc bookingId)
6. "check_availability": Kiểm tra một phòng cụ thể có trống không

📌 Lưu ý quan trọng:
- Trả lời bằng ngôn ngữ của người dùng (Tiếng Việt hoặc English)
- Nếu thiếu thông tin (ngày, giờ, số người) → hỏi lại, dùng action "chat"
- Khi đề xuất giờ kết thúc: nếu user không nêu → dự kiến 1 giờ sau giờ bắt đầu
- Ngắn gọn, thân thiện, chuyên nghiệp
- Không tự ý tạo booking — chỉ đề xuất (propose_booking), để user xác nhận`;

  try {
    const res = await callGemini(history, userMessage, systemPrompt);
    console.log('SUCCESS Response:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('FAILED WITH ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
