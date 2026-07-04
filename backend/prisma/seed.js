/**
 * Prisma Seed Script
 * Populates the database with sample data for development and testing.
 *
 * Run with: npx prisma db seed
 * Or:       npm run db:seed
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

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
  await prisma.chatMessage.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.bookingComment.deleteMany();
  await prisma.bookingTemplate.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.recurringBooking.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();
  await prisma.room.deleteMany();
  await prisma.systemSettings.deleteMany();

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
      fullName: 'Nguyen Van A',
      role: 'user',
      isActive: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@company.com',
      passwordHash,
      fullName: 'Tran Thi B',
      role: 'user',
      isActive: true,
    },
  });

  console.log(`  ✅ Created ${4} users`);

  // ── Rooms ──
  console.log('  🏢 Creating rooms...');

  // Tầng 1
  const room1 = await prisma.room.create({
    data: {
      name: 'Hoi truong Diamond',
      capacity: 30,
      location: 'Tang 1, Toa A',
      equipment: ['May chieu laser', 'He thong am thanh', 'Micro khong day', 'Video conference', 'Dieu hoa trung tam', 'Bang trang dien tu'],
      isActive: true,
      floor: '1', building: 'A', mapX: 0, mapY: 0,
    },
  });

  const room1b = await prisma.room.create({
    data: {
      name: 'Phong hoi Jade',
      capacity: 10,
      location: 'Tang 1, Toa A',
      equipment: ['May chieu', 'Bang trang', 'Dieu hoa'],
      isActive: true,
      floor: '1', building: 'A', mapX: 1, mapY: 0,
    },
  });

  // Tầng 2
  const room2 = await prisma.room.create({
    data: {
      name: 'Phong hop Emerald',
      capacity: 6,
      location: 'Tang 2, Toa A',
      equipment: ['May chieu', 'Bang trang', 'TV 55"', 'Dieu hoa'],
      isActive: true,
      floor: '2', building: 'A', mapX: 0, mapY: 0,
    },
  });

  const room3 = await prisma.room.create({
    data: {
      name: 'Phong hop Ruby',
      capacity: 4,
      location: 'Tang 2, Toa A',
      equipment: ['TV 43"', 'Bang trang', 'Dieu hoa'],
      isActive: true,
      floor: '2', building: 'A', mapX: 1, mapY: 0,
    },
  });

  const room4 = await prisma.room.create({
    data: {
      name: 'Phong hop Topaz',
      capacity: 8,
      location: 'Tang 2, Toa A',
      equipment: ['May chieu', 'Webcam', 'Dieu hoa', 'Bang trang'],
      isActive: true,
      floor: '2', building: 'A', mapX: 2, mapY: 0,
    },
  });

  // Tầng 3
  const room5 = await prisma.room.create({
    data: {
      name: 'Phong hop Sapphire',
      capacity: 12,
      location: 'Tang 3, Toa A',
      equipment: ['May chieu 4K', 'Video conference', 'Bang trang', 'Dieu hoa', 'Mini bar'],
      isActive: true,
      floor: '3', building: 'A', mapX: 0, mapY: 0,
    },
  });

  const room6 = await prisma.room.create({
    data: {
      name: 'Phong hop Opal',
      capacity: 6,
      location: 'Tang 3, Toa A',
      equipment: ['TV 55"', 'Webcam', 'Dieu hoa'],
      isActive: true,
      floor: '3', building: 'A', mapX: 1, mapY: 0,
    },
  });

  const room7 = await prisma.room.create({
    data: {
      name: 'Phong thao luan Amber',
      capacity: 4,
      location: 'Tang 3, Toa A',
      equipment: ['TV 43"', 'Bang trang', 'Dieu hoa'],
      isActive: true,
      floor: '3', building: 'A', mapX: 2, mapY: 0,
    },
  });

  // Tầng 4
  const room8 = await prisma.room.create({
    data: {
      name: 'Phong brainstorm Pearl',
      capacity: 8,
      location: 'Tang 4, Toa A',
      equipment: ['Bang trang lon', 'Post-it boards', 'TV 65"', 'Dieu hoa', 'Ghe bean bag'],
      isActive: true,
      floor: '4', building: 'A', mapX: 0, mapY: 0,
    },
  });

  // Tòa B
  const room9 = await prisma.room.create({
    data: {
      name: 'Phong hop Coral',
      capacity: 6,
      location: 'Tang 1, Toa B',
      equipment: ['TV 43"', 'Bang trang', 'Dieu hoa'],
      isActive: true,
      floor: '1', building: 'B', mapX: 0, mapY: 0,
    },
  });

  const room10 = await prisma.room.create({
    data: {
      name: 'Phong hop Slate',
      capacity: 8,
      location: 'Tang 2, Toa B',
      equipment: ['May chieu', 'Webcam', 'Dieu hoa'],
      isActive: true,
      floor: '2', building: 'B', mapX: 0, mapY: 0,
    },
  });

  console.log(`  ✅ Created ${10} rooms`);

  // ── Bookings ──
  console.log('  📅 Creating bookings...');

  // Booking 1: approved - upcoming
  const booking1 = await prisma.booking.create({
    data: {
      roomId: room2.id,
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
      roomId: room5.id,
      userId: user2.id,
      title: 'Q1 Review Meeting',
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
      roomId: room1.id,
      userId: user2.id,
      title: 'Company All-hands Meeting',
      startTime: daysFromNow(5, 13, 0),
      endTime: daysFromNow(5, 17, 0),
      status: 'rejected',
      approvedBy: approver.id,
      approvedAt: new Date(),
      rejectionReason: 'Phong da duoc dat truoc cho su kien cong ty. Vui long chon ngay khac.',
    },
  });

  // Booking 5: cancelled
  const booking5 = await prisma.booking.create({
    data: {
      roomId: room2.id,
      userId: user1.id,
      title: 'Workshop UX Design',
      startTime: daysFromNow(3, 10, 0),
      endTime: daysFromNow(3, 12, 0),
      status: 'cancelled',
    },
  });

  // Booking 6: pending - upcoming
  const booking6 = await prisma.booking.create({
    data: {
      roomId: room8.id,
      userId: user2.id,
      title: 'Brainstorming Feature Q2',
      startTime: daysFromNow(4, 15, 0),
      endTime: daysFromNow(4, 17, 30),
      status: 'pending',
    },
  });

  // Booking 7: approved - today (in progress)
  const booking7 = await prisma.booking.create({
    data: {
      roomId: room5.id,
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
      roomId: room1.id,
      userId: admin.id,
      title: 'Annual Strategy Meeting',
      startTime: daysFromNow(-7, 9, 0),
      endTime: daysFromNow(-7, 17, 0),
      status: 'approved',
      approvedBy: admin.id,
      approvedAt: daysFromNow(-8),
    },
  });

  // Booking 9: approved - today starting soon (for floor map demo)
  const nowHour = new Date().getHours();
  const booking9 = await prisma.booking.create({
    data: {
      roomId: room3.id,
      userId: user2.id,
      title: 'Product Demo',
      startTime: daysFromNow(0, Math.min(nowHour + 1, 21), 0),
      endTime: daysFromNow(0, Math.min(nowHour + 2, 22), 0),
      status: 'approved',
      approvedBy: approver.id,
      approvedAt: daysFromNow(-1),
    },
  });

  console.log(`  ✅ Created ${9} bookings`);

  // ── Sample Comments ──
  console.log('  💬 Creating sample comments...');

  await prisma.bookingComment.create({
    data: {
      bookingId: booking1.id,
      userId: user1.id,
      content: 'Nho chuan bi slide truoc 30 phut nhe moi nguoi!',
    },
  });

  await prisma.bookingComment.create({
    data: {
      bookingId: booking1.id,
      userId: approver.id,
      content: 'OK, minh se den som de setup man hinh.',
    },
  });

  await prisma.bookingComment.create({
    data: {
      bookingId: booking2.id,
      userId: user2.id,
      content: 'Cuoc hop nay rat quan trong voi khach hang VIP, mong duoc duyet som.',
    },
  });

  console.log(`  ✅ Created sample comments`);

  // ── Sample Notifications ──
  console.log('  🔔 Creating sample notifications...');

  await prisma.notification.create({
    data: {
      userId: user1.id,
      type: 'booking_approved',
      title: 'Dat phong duoc duyet',
      message: `Booking "Sprint Planning Q1" da duoc duyet. Phong ${room2.name} tu 9:00 - 11:00.`,
      bookingId: booking1.id,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: user2.id,
      type: 'booking_rejected',
      title: 'Dat phong bi tu choi',
      message: `Booking "Company All-hands Meeting" da bi tu choi. Ly do: Phong da duoc dat truoc.`,
      bookingId: booking4.id,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: approver.id,
      type: 'new_booking_pending',
      title: 'Co dat phong moi can duyet',
      message: `"${booking2.title}" can duoc duyet. Phong ${room5.name}.`,
      bookingId: booking2.id,
      isRead: false,
    },
  });

  console.log(`  ✅ Created sample notifications`);

  // ── Sample Templates ──
  console.log('  📋 Creating booking templates...');

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
      name: 'Hop chieu thuong le',
      roomId: room2.id,
      title: 'Cuoc hop nhom chieu',
      startTime: startTimeAfternoon,
      endTime: endTimeAfternoon,
    },
  });

  console.log(`  ✅ Created booking templates`);

  // ── System Settings ──
  console.log('  ⚙️ Creating default system settings...');
  await prisma.systemSettings.create({
    data: {
      id: 1,
      workHourStart: '07:00',
      workHourEnd: '22:00',
      maxBookingDaysAhead: 30,
      minBookingDurationMin: 30,
      maxBookingDurationMin: 480,
      noShowReleaseTimeMin: 15,
      allowCancelApproved: true,
    },
  });
  console.log('  ✅ Created default system settings');

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
  console.log('  Rooms: 10 (Toa A: Tang 1-4, Toa B: Tang 1-2)');
  console.log('  Bookings: 9 (approved/pending/rejected/cancelled)');
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
