const { z } = require('zod');

/**
 * Validator for recurring booking creation / preview.
 *
 * Fields:
 *   roomId     - UUID of the room
 *   title      - booking title (1–200 chars)
 *   startDate  - 'YYYY-MM-DD'
 *   endDate    - 'YYYY-MM-DD', must be after startDate and within 6 months
 *   startTime  - 'HH:mm' (07:00–22:00 range enforced in service)
 *   endTime    - 'HH:mm', must be after startTime
 *   frequency  - 'daily' | 'weekly' | 'monthly'
 */
const createRecurringSchema = z
  .object({
    roomId: z.string().uuid({ message: 'roomId must be a valid UUID' }),

    title: z
      .string()
      .min(1, { message: 'Title is required' })
      .max(200, { message: 'Title must not exceed 200 characters' }),

    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be in YYYY-MM-DD format' }),

    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be in YYYY-MM-DD format' }),

    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:mm format' }),

    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:mm format' }),

    frequency: z.enum(['daily', 'weekly', 'monthly'], {
      errorMap: () => ({ message: 'frequency must be one of: daily, weekly, monthly' }),
    }),

    // Optional: list of slot ISO strings the user confirmed to book
    confirmedSlots: z
      .array(
        z.object({
          startTime: z.string(),
          endTime: z.string(),
        })
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    // endDate must be after startDate
    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'endDate must be after startDate',
      });
    }

    // endDate must be within 6 months from startDate
    const sixMonthsLater = new Date(start);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    if (end > sixMonthsLater) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'endDate must be within 6 months from startDate',
      });
    }

    // startTime < endTime (lexicographic comparison works for HH:mm)
    if (data.startTime >= data.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'endTime must be after startTime',
      });
    }
  });

module.exports = { createRecurringSchema };
