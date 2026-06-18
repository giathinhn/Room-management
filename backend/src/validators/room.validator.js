const { z } = require('zod');

/**
 * Equipment options available for rooms.
 */
const EQUIPMENT_OPTIONS = ['Máy chiếu', 'Micro', 'Bảng trắng', 'TV', 'Webcam', 'Loa', 'Điều hòa'];

/**
 * Schema for creating a new room.
 * - name: 1–100 characters
 * - capacity: 1–500
 * - location: 1–200 characters
 * - equipment: array of valid equipment strings
 */
const createRoomSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Room name is required' })
    .max(100, { message: 'Room name must not exceed 100 characters' }),
  capacity: z
    .number({ invalid_type_error: 'Capacity must be a number' })
    .int({ message: 'Capacity must be an integer' })
    .min(1, { message: 'Capacity must be at least 1' })
    .max(500, { message: 'Capacity must not exceed 500' }),
  location: z
    .string()
    .min(1, { message: 'Location is required' })
    .max(200, { message: 'Location must not exceed 200 characters' }),
  equipment: z
    .array(z.string())
    .default([]),
});

/**
 * Schema for updating a room.
 * All fields are optional; rules are the same as createRoomSchema.
 */
const updateRoomSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Room name is required' })
    .max(100, { message: 'Room name must not exceed 100 characters' })
    .optional(),
  capacity: z
    .number({ invalid_type_error: 'Capacity must be a number' })
    .int({ message: 'Capacity must be an integer' })
    .min(1, { message: 'Capacity must be at least 1' })
    .max(500, { message: 'Capacity must not exceed 500' })
    .optional(),
  location: z
    .string()
    .min(1, { message: 'Location is required' })
    .max(200, { message: 'Location must not exceed 200 characters' })
    .optional(),
  equipment: z.array(z.string()).optional(),
});

/**
 * Schema for querying rooms (list with filters).
 * - page ≥ 1
 * - limit 1–100
 * - capacity ≥ 1
 */
const queryRoomSchema = z.object({
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
  capacity: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined))
    .pipe(z.number().min(1).optional()),
  location: z.string().optional(),
  equipment: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      if (!v) return undefined;
      return Array.isArray(v) ? v : [v];
    }),
  search: z.string().optional(),
});

/**
 * Schema for querying available rooms.
 * - startTime & endTime: ISO datetime strings, startTime < endTime
 * - capacity, equipment: optional filters
 */
const availableRoomSchema = z
  .object({
    startTime: z.string().datetime({ message: 'startTime must be a valid ISO datetime' }),
    endTime: z.string().datetime({ message: 'endTime must be a valid ISO datetime' }),
    capacity: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : undefined))
      .pipe(z.number().min(1).optional()),
    equipment: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((v) => {
        if (!v) return undefined;
        return Array.isArray(v) ? v : [v];
      }),
  })
  .refine((data) => new Date(data.startTime) < new Date(data.endTime), {
    message: 'startTime must be before endTime',
    path: ['startTime'],
  });

module.exports = {
  createRoomSchema,
  updateRoomSchema,
  queryRoomSchema,
  availableRoomSchema,
  EQUIPMENT_OPTIONS,
};
