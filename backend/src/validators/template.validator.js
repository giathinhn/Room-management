const { z } = require('zod');

/**
 * HH:mm time string regex (e.g. "09:00", "17:30").
 */
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Schema for creating a new booking template.
 * Fields: name (required), roomId (optional UUID), title (required), startTime (HH:mm), endTime (HH:mm)
 */
const createTemplateSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Tên template là bắt buộc' })
    .max(100, { message: 'Tên template không quá 100 ký tự' }),

  roomId: z
    .string()
    .uuid({ message: 'roomId phải là UUID hợp lệ' })
    .optional()
    .or(z.literal('')),

  title: z
    .string()
    .min(1, { message: 'Tiêu đề cuộc họp là bắt buộc' })
    .max(200, { message: 'Tiêu đề không quá 200 ký tự' }),

  startTime: z
    .string()
    .regex(timeRegex, { message: 'startTime phải theo định dạng HH:mm (vd: 09:00)' }),

  endTime: z
    .string()
    .regex(timeRegex, { message: 'endTime phải theo định dạng HH:mm (vd: 10:00)' }),
});

/**
 * Schema for updating a booking template.
 * All fields are optional.
 */
const updateTemplateSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Tên template không được rỗng' })
    .max(100, { message: 'Tên template không quá 100 ký tự' })
    .optional(),

  roomId: z
    .string()
    .uuid({ message: 'roomId phải là UUID hợp lệ' })
    .optional()
    .nullable(),

  title: z
    .string()
    .min(1, { message: 'Tiêu đề không được rỗng' })
    .max(200, { message: 'Tiêu đề không quá 200 ký tự' })
    .optional(),

  startTime: z
    .string()
    .regex(timeRegex, { message: 'startTime phải theo định dạng HH:mm' })
    .optional(),

  endTime: z
    .string()
    .regex(timeRegex, { message: 'endTime phải theo định dạng HH:mm' })
    .optional(),
});

module.exports = {
  createTemplateSchema,
  updateTemplateSchema,
};
