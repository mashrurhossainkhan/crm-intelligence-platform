const AppError = require('../utils/AppError');

/**
 * validate(schema)
 * schema is a Zod schema, e.g. z.object({ body: z.object({...}) })
 */
const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!parsed.success) {
      const message = parsed.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');

      return next(new AppError(`Validation error: ${message}`, 400));
    }

    // Optionally replace req values with parsed/cleaned data
    req.body = parsed.data.body;
    req.params = parsed.data.params;
    req.query = parsed.data.query;

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = validate;
