const ApiError = require('../utils/ApiError');

/**
 * validate — factory that returns a middleware validating req.body against a Zod schema.
 *
 * Usage:
 *   router.post('/register', validate(registerSchema), authController.register)
 *
 * On validation failure: passes ApiError 400 with detailed field-level errors to next().
 * On success: replaces req.body with the parsed (coerced) data and calls next().
 *
 * @param {import('zod').ZodTypeAny} schema — a Zod schema
 * @returns {import('express').RequestHandler}
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      const error = ApiError.badRequest('Validation failed');
      error.details = details;
      return next(error);
    }

    // Replace body with validated + coerced data
    req.body = result.data;
    return next();
  };
}

module.exports = validate;
