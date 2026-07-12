const swaggerJsDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Meeting Room Booking API',
      version: '1.0.0',
      description: 'API quản lý phòng họp và đăng ký lịch sử dụng (RoomSync)',
    },
    servers: [
      { url: '/api', description: 'API Server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user-uuid-123' },
            email: { type: 'string', example: 'user@company.com' },
            fullName: { type: 'string', example: 'Nguyễn Văn A' },
            role: { type: 'string', enum: ['admin', 'approver', 'user'], example: 'user' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-05T08:00:00.000Z' },
          },
        },
        Room: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'room-uuid-456' },
            name: { type: 'string', example: 'Phòng Hội Thảo A' },
            capacity: { type: 'integer', example: 15 },
            location: { type: 'string', example: 'Tầng 2, Tòa nhà A' },
            equipment: {
              type: 'array',
              items: { type: 'string' },
              example: ['Projector', 'Whiteboard', 'Wifi'],
            },
            isActive: { type: 'boolean', example: true },
            autoApprove: { type: 'boolean', example: false },
            building: { type: 'string', example: 'Building A' },
            floor: { type: 'integer', example: 2 },
            x: { type: 'number', example: 120.5 },
            y: { type: 'number', example: 85.2 },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'booking-uuid-789' },
            roomId: { type: 'string', example: 'room-uuid-456' },
            userId: { type: 'string', example: 'user-uuid-123' },
            title: { type: 'string', example: 'Họp Kế Hoạch Quý 3' },
            startTime: { type: 'string', format: 'date-time', example: '2026-07-06T09:00:00.000Z' },
            endTime: { type: 'string', format: 'date-time', example: '2026-07-06T10:30:00.000Z' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'cancelled'], example: 'pending' },
            approvedBy: { type: 'string', nullable: true, example: 'approver-uuid-999' },
            rejectionReason: { type: 'string', nullable: true, example: 'Trùng lịch ban giám đốc' },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-05T08:00:00.000Z' },
            isCheckedIn: { type: 'boolean', example: false },
            checkInTime: { type: 'string', format: 'date-time', nullable: true, example: null },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 45 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string', example: 'Yêu cầu không hợp lệ' },
                details: {
                  type: 'array',
                  items: { type: 'object' },
                  example: [{ message: 'Email không đúng định dạng', path: ['email'] }],
                },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],  // Đọc JSDoc comments từ route files
};

module.exports = swaggerJsDoc(options);
