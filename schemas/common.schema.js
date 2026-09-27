const { z } = require("zod");

/**
 * Common validation schemas reusable across routes
 */

// Query schema requiring a valid HTTP/HTTPS URL
const urlQuerySchema = z.object({
  url: z
    .string({
      required_error: "Query parameter 'url' is required",
      invalid_type_error: "Query parameter 'url' must be a string",
    })
    .trim()
    .url("Please provide a valid URL (must include http:// or https://)"),
});

// Body schema requiring a valid HTTP/HTTPS URL
const urlBodySchema = z.object({
  url: z
    .string({
      required_error: "Body parameter 'url' is required",
      invalid_type_error: "Body parameter 'url' must be a string",
    })
    .trim()
    .url("Please provide a valid URL (must include http:// or https://)"),
});

// Common pagination schema
const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, "Page must be a positive integer"),
  limit: z
    .string()
    .optional()
    .default("10")
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val <= 100, "Limit must be between 1 and 100"),
});

module.exports = {
  urlQuerySchema,
  urlBodySchema,
  paginationSchema,
};
