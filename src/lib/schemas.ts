import { z } from "zod";

export const destinationsSchema = z
  .array(z.enum(["screen", "album"]))
  .min(1, "Elige al menos un destino")
  .max(2)
  .transform((d) => Array.from(new Set(d)));

export const messageSchema = z
  .string()
  .trim()
  .max(280, "El mensaje puede tener hasta 280 caracteres")
  .transform((s) => s.replace(/[\u0000-\u001f\u007f]/g, ""))
  .optional();

export const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"] as const;

export const fileRequestSchema = z.object({
  type: z.enum(allowedTypes),
  size: z.number().int().positive(),
  name: z.string().max(200).optional(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});

export const quoteSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  event_type: z.string().trim().min(2).max(60),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  location: z.string().trim().max(160).optional().or(z.literal("")),
  guests: z.coerce.number().int().min(1).max(5000).optional(),
  comments: z.string().trim().max(3000).optional().or(z.literal("")),
  website: z.string().max(0).optional(), // trampa anti-spam: debe venir vacío
});
