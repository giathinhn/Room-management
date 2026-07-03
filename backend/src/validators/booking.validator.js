const { z } = require('zod');

const BOOKING_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];

/**
 * Schema for creating a new booking.
 * - roomId: UUID
 * - title: 1–200 characters
 * - startTime / endTime: ISO datetime strings
 */
const createBookingSchema = z.object({
  roomId: z.string().uuid({ message: 'roomId must be a valid UUID' }),
  title: z
    .string()
    .min(1, { message: 'Title is required' })
    .max(200, { message: 'Title must not exceed 200 characters' }),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'startTime must be a valid datetime string' }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'endTime must be a valid datetime string' }),
});

/**
 * Schema for rejecting a booking.
 * - rejectionReason: 1–500 characters
 */
const rejectBookingSchema = z.object({
  rejectionReason: z
    .string()
    .min(1, { message: 'Rejection reason is required' })
    .max(500, { message: 'Rejection reason must not exceed 500 characters' }),
});

/**
 * Schema for querying bookings (list with filters).
 */
const queryBookingSchema = z.object({
  roomId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  status: z
    .enum(BOOKING_STATUSES, {
      errorMap: () => ({
        message: `Status must be one of: ${BOOKING_STATUSES.join(', ')}`,
      }),
    })
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().min(1, { message: 'Page must be at least 1' })),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 10))
    .pipe(z.number().min(1).max(100, { message: 'Limit must be between 1 and 100' })),
});

module.exports = {
  createBookingSchema,
  rejectBookingSchema,
  queryBookingSchema,
  BOOKING_STATUSES,
};
