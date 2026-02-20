import { z } from "zod";

export const holdSchema = z.object({
  club_id: z.number().int().positive().default(1),
  court_id: z.number().int().positive(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  duration_min: z.number().int().positive(),
  total_amount: z.number().nonnegative(),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  customer_email: z.string().email().optional().or(z.literal(""))
});

export const confirmSchema = z.object({
  club_id: z.number().int().positive().default(1),
  booking_code: z.string().min(3),
  customer_name: z.string().min(2),
  customer_phone: z.string().min(6),
  customer_email: z.string().email(),
  notes: z.string().optional(),
  payment_ui_method: z.enum(["mp", "transfer", "cash"])
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4)
});
