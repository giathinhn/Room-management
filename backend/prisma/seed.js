/**
 * Prisma Seed Script
 * Populates the database with sample data for development and testing.
 *
 * Run with: npx prisma db seed
 * Or:       npm run db:seed
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Hash password dynamically using bcryptjs.
 */
function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

/**
 * Creates a date relative to now
 */
function daysFromNow(days, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting seed...');

  // ── Clean existing data ──
  console.log('  🗑️  Cleaning existing data...');
  await prisma.notification.deleteMany();
  await prisma.bookingComment.deleteMany();
  await prisma.bookingTemplate.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.recurringBooking.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.room.deleteMany();

  // ── Users ──
  console.log('  👤 Creating users...');
  const passwordHash = hashPassword('Password123!');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@company.com',
      passwordHash,
      fullName: 'Admin User',
      role: 'admin',
      isActive: true,
    },
  });

  const approver = await prisma.user.create({
    data: {
      email: 'approver@company.com',
      passwordHash,
      fullName: 'Approver User',
      role: 'approver',
      isActive: true,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'user1@company.com',
      passwordHash,
      fullName: 'Nguyễn Văn A',
      role: 'user',
      isActive: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@company.com',
      passwordHash,
      fullName: 'Trần Thị B',
      role: 'user',
      isActive: true,
    },
  });

  console.log(`  ✅ Created ${4} users`);

  // ── Rooms ──
  console.log('  🏢 Creating rooms...');

  const room1 = await prisma.room.create({
    data: {
      name: 'Phòng họp Emerald',
      capacity: 6,
      location: 'Tầng 2, Tòa A',
      equipment: ['Máy chiếu', 'Bảng trắng', 'TV 55"', 'Điều hòa'],
      isActive: true,
    },
  });

  const room2 = await prisma.room.create({
    data: {
      name: 'Phòng họp Sapphire',
      capacity: 12,
      location: 'Tầng 3, Tòa A',
      equipment: ['Máy chiếu 4K', 'Video conference', 'Bảng trắng', 'Điều hòa', 'Mini bar'],
      isActive: true,
    },
  });

  const room3 = await prisma.room.create({
    data: {
      name: 'Phòng họp Ruby',
      capacity: 4,
      location: 'Tầng 2, Tòa B',
      equipment: ['TV 43"', 'Bảng trắng', 'Điều hòa'],
      isActive: true,
    },
  });

  const room4 = await prisma.room.create({
    data: {
      name: 'Hội trường Diamond',
      capacity: 30,
      location: 'Tầng 1, Tòa A',
      equipment: ['Máy chiếu laser', 'Hệ thống âm thanh', 'Micro không dây', 'Video conference', 'Điều hòa trung tâm', 'Bảng trắng điện tử'],
      isActive: true,
    },
  });

  const room5 = await prisma.room.create({
    data: {
      name: 'Phòng brainstorm Pearl',
      capacity: 8,
      location: 'Tầng 4, Tòa A',
      equipment: ['Bảng trắng lớn', 'Post-it boards', 'TV 65"', 'Điều hòa', 'Ghế bean bag'],
      isActive: true,
    },
  });

  console.log(`  ✅ Created ${5} rooms`);

  // ── Bookings ──
  console.log('  📅 Creating bookings...');

  // Booking 1: approved - upcoming
  const booking1 = await prisma.booking.create({
    data: {
      roomId: room1.id,
      userId: user1.id,
      title: 'Sprint Planning Q1',
      startTime: daysFromNow(1, 9, 0),
      endTime: daysFromNow(1, 11, 0),
      status: 'approved',
      approvedBy: approver.id,
      approvedAt: new Date(),
    },
  });

  // Booking 2: pending - upcoming
  const booking2 = await prisma.booking.create({
    data: {
      roomId: room2.id,
      userId: user2.id,
      title: 'Cuộc họp Q1 Review với khách hàng',
      startTime: daysFromNow(2, 14, 0),
      endTime: daysFromNow(2, 16, 0),
      status: 'pending',
    },
  });

  // Booking 3: approved - past
  const booking3 = await prisma.booking.create({
    data: {
      roomId: room3.id,
      userId: user1.id,
      title: 'Daily Standup',
      startTime: daysFromNow(-1, 9, 30),
      endTime: daysFromNow(-1, 10, 0),
      status: 'approved',
      approvedBy: approver.id,
      approvedAt: daysFromNow(-2),
    },
  });

  // Booking 4: rejected
  const booking4 = await prisma.booking.create({
    data: {
      roomId: room4.id,
      userId: user2.id,
      title: 'Company All-hands Meeting',
      startTime: daysFromNow(5, 13, 0),
      endTime: daysFromNow(5, 17, 0),
      status: 'rejected',
      approvedBy: approver.id,
      approvedAt: new Date(),
      rejectionReason: 'Phòng đã được đặt trước cho sự kiện công ty. Vui lòng chọn ngày khác.',
    },
  });

  // Booking 5: cancelled
  const booking5 = await prisma.booking.create({
    data: {
      roomId: room1.id,
      userId: user1.id,
      title: 'Workshop thiết kế UX',
      startTime: daysFromNow(3, 10, 0),
      endTime: daysFromNow(3, 12, 0),
      status: 'cancelled',
    },
  });

  // Booking 6: pending - upcoming
  const booking6 = await prisma.booking.create({
    data: {
      roomId: room5.id,
      userId: user2.id,
      title: 'Brainstorming Feature Q2',
      startTime: daysFromNow(4, 15, 0),
      endTime: daysFromNow(4, 17, 30),
      status: 'pending',
    },
  });

  // Booking 7: approved - today
  const booking7 = await prisma.booking.create({
    data: {
      roomId: room2.id,
      userId: user1.id,
      title: 'Tech Architecture Review',
      startTime: daysFromNow(0, 14, 0),
      endTime: daysFromNow(0, 16, 0),
      status: 'approved',
      approvedBy: approver.id,
      approvedAt: daysFromNow(-1),
    },
  });

  // Booking 8: approved - past (for admin)
  const booking8 = await prisma.booking.create({
    data: {
      roomId: room4.id,
      userId: admin.id,
      title: 'Annual Strategy Meeting',
      startTime: daysFromNow(-7, 9, 0),
      endTime: daysFromNow(-7, 17, 0),
      status: 'approved',
      approvedBy: admin.id,
      approvedAt: daysFromNow(-8),
    },
  });

  console.log(`  ✅ Created ${8} bookings`);

  // ── Sample Comments ──
  console.log('  💬 Creating sample comments...');

  await prisma.bookingComment.create({
    data: {
      bookingId: booking1.id,
      userId: user1.id,
      content: 'Nhớ chuẩn bị slide trước 30 phút nhé mọi người!',
    },
  });

  await prisma.bookingComment.create({
    data: {
      bookingId: booking1.id,
      userId: approver.id,
      content: 'OK, mình sẽ đến sớm để setup màn hình.',
    },
  });

  await prisma.bookingComment.create({
    data: {
      bookingId: booking2.id,
      userId: user2.id,
      content: 'Cuộc họp này rất quan trọng với khách hàng VIP, mong được duyệt sớm.',
    },
  });

  console.log(`  ✅ Created sample comments`);

  // ── Sample Notifications ──
  console.log('  🔔 Creating sample notifications...');

  await prisma.notification.create({
    data: {
      userId: user1.id,
      type: 'booking_approved',
      title: 'Đặt phòng được duyệt',
      message: `Booking "Sprint Planning Q1" đã được duyệt. Phòng ${room1.name} từ 9:00 - 11:00.`,
      bookingId: booking1.id,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: user2.id,
      type: 'booking_rejected',
      title: 'Đặt phòng bị từ chối',
      message: `Booking "Company All-hands Meeting" đã bị từ chối. Lý do: Phòng đã được đặt trước.`,
      bookingId: booking4.id,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: approver.id,
      type: 'new_booking_pending',
      title: 'Có đặt phòng mới cần duyệt',
      message: `"${booking2.title}" cần được duyệt. Phòng ${room2.name}.`,
      bookingId: booking2.id,
      isRead: false,
    },
  });

  console.log(`  ✅ Created sample notifications`);

  // ── Sample Templates ──
  console.log('  📋 Creating booking templates...');

  // Time objects for templates (date part doesn't matter, only time)
  const startTimeMorning = new Date('1970-01-01T09:00:00.000Z');
  const endTimeMorning = new Date('1970-01-01T10:00:00.000Z');
  const startTimeAfternoon = new Date('1970-01-01T14:00:00.000Z');
  const endTimeAfternoon = new Date('1970-01-01T15:30:00.000Z');

  await prisma.bookingTemplate.create({
    data: {
      userId: user1.id,
      name: 'Daily Standup',
      roomId: room3.id,
      title: 'Daily Standup',
      startTime: startTimeMorning,
      endTime: endTimeMorning,
    },
  });

  await prisma.bookingTemplate.create({
    data: {
      userId: user2.id,
      name: 'Họp chiều thường lệ',
      roomId: room1.id,
      title: 'Cuộc họp nhóm chiều',
      startTime: startTimeAfternoon,
      endTime: endTimeAfternoon,
    },
  });

  console.log(`  ✅ Created booking templates`);

  // ── Summary ──
  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log('  Users:');
  console.log('    admin@company.com     (role: admin)');
  console.log('    approver@company.com  (role: approver)');
  console.log('    user1@company.com     (role: user)');
  console.log('    user2@company.com     (role: user)');
  console.log('  Password for all accounts: Password123!');
  console.log('');
  console.log('  Rooms: 5 (Emerald, Sapphire, Ruby, Diamond, Pearl)');
  console.log('  Bookings: 8 (approved/pending/rejected/cancelled)');
  console.log('');
  console.log('  Run `npm run db:studio` to explore data in Prisma Studio.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
