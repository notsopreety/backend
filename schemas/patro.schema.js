const { z } = require("zod");

/**
 * Optional query schema for Patro endpoint
 */
const patroQuerySchema = z.object({
  lang: z.enum(["en", "np"]).optional().default("en"),
});

/**
 * Schema defining the structured detailed Patro response contract
 */
const patroDetailedResponseSchema = z.object({
  miti: z.object({
    gatey: z.string(),
    mahina: z.string(),
    baar: z.string(),
    barsa: z.string(),
  }),
  date: z.object({
    month: z.string(),
    day: z.string(),
    year: z.string(),
  }),
  tithi: z.string(),
  event: z.string().nullable().optional(),
  isHoliday: z.boolean(),
  accent: z.string().optional(),
});

module.exports = {
  patroQuerySchema,
  patroDetailedResponseSchema,
};
