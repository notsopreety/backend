const ApiError = require("../utils/apiError");

/**
 * Middleware factory for validating incoming request targets against Zod schemas.
 * Supports query, body, and params.
 * 
 * Usage:
 *   router.get('/endpoint', validate({ query: myQuerySchema }), controller);
 *   router.post('/endpoint', validate({ body: myBodySchema }), controller);
 * 
 * @param {Object} schemas
 * @param {import('zod').ZodSchema} [schemas.query]
 * @param {import('zod').ZodSchema} [schemas.body]
 * @param {import('zod').ZodSchema} [schemas.params]
 */
const validate = (schemas = {}) => {
  return (req, res, next) => {
    // Also allow passing a single schema defaulting to query if GET or body if POST/PUT
    let targets = schemas;
    if (schemas && typeof schemas.safeParse === "function") {
      const defaultTarget = req.method === "GET" ? "query" : "body";
      targets = { [defaultTarget]: schemas };
    }

    const errors = [];
    req.validated = req.validated || {};

    const availableTargets = ["query", "body", "params"];

    for (const target of availableTargets) {
      const schema = targets[target];
      if (schema) {
        const result = schema.safeParse(req[target]);
        if (!result.success) {
          result.error.issues.forEach((issue) => {
            errors.push({
              target,
              field: issue.path.join(".") || target,
              message: issue.message,
            });
          });
        } else {
          // Replace or augment with sanitized & coerced data
          req.validated[target] = result.data;
          try {
            req[target] = result.data;
          } catch {
            // Some Express versions make req.query read-only in getter mode
          }
        }
      }
    }

    if (errors.length > 0) {
      return next(ApiError.badRequest("Validation error", errors));
    }

    next();
  };
};

module.exports = validate;
