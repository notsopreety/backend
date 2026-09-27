const { z } = require("zod");

const DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

const messageItemSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1, "Message content cannot be empty"),
});

// GET /api/ai/chat query schema
const aiChatQuerySchema = z.object({
  prompt: z
    .string({
      required_error: "Parameter 'prompt' is required",
    })
    .trim()
    .min(1, "Prompt cannot be empty"),
  model: z.string().trim().default(DEFAULT_MODEL),
  history: z
    .string()
    .optional()
    .default("[]")
    .transform((val) => {
      if (!val || val.trim() === "") return [];
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }),
  system: z.string().trim().optional(),
});

// POST /api/ai/chat body schema
const aiChatBodySchema = z.object({
  prompt: z
    .string({
      required_error: "Body field 'prompt' is required",
    })
    .trim()
    .min(1, "Prompt cannot be empty"),
  model: z.string().trim().default(DEFAULT_MODEL),
  history: z
    .union([z.array(messageItemSchema), z.string()])
    .optional()
    .default([])
    .transform((val) => {
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return val || [];
    }),
  system: z.string().trim().optional(),
});

module.exports = {
  DEFAULT_MODEL,
  aiChatQuerySchema,
  aiChatBodySchema,
};
