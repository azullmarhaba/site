import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email().max(255);
export const passwordSchema = z.string().min(8).max(128);

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "MISMATCH",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z
  .object({
    token: z.string().min(16).max(256),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "MISMATCH",
    path: ["confirmPassword"],
  });

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: emailSchema,
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(5000),
  locale: z.string().max(5).optional(),
});

export const bookingSchema = z.object({
  experienceSlug: z.string().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().int().min(1).max(40),
  children: z.number().int().min(0).max(40),
  mode: z.enum(["PRIVATE", "GROUP"]).default("PRIVATE"),
  pickupLocationId: z.string().optional().or(z.literal("")),
  pickupAddress: z.string().trim().max(255).optional().or(z.literal("")),
  specialRequests: z.string().trim().max(2000).optional().or(z.literal("")),
  couponCode: z.string().trim().max(60).optional().or(z.literal("")),
  leadFirstName: z.string().trim().min(1).max(100),
  leadLastName: z.string().trim().min(1).max(100),
  email: emailSchema,
  phone: z.string().trim().min(3).max(40),
  tourDateId: z.string().optional().or(z.literal("")),
  // Cash on Delivery — the only settlement method; customers are never asked
  // to choose or enter a payment method.
  paymentMethod: z.literal("COD").default("COD"),
});

export const reviewSchema = z.object({
  experienceSlug: z.string().min(1),
  bookingReference: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(160).optional().or(z.literal("")),
  body: z.string().trim().min(10).max(4000),
});

export const favoriteSchema = z.object({
  experienceSlug: z.string().min(1),
});

export const tripPlanSchema = z.object({
  days: z.number().int().min(1).max(21),
  style: z.enum(["solo", "couple", "family", "friends", "group"]),
  interests: z.array(z.string().min(1).max(40)).min(1).max(8),
  budget: z.enum(["economy", "comfort", "premium"]),
  groupType: z.string().trim().max(40).optional().or(z.literal("")),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  locale: z.enum(["en", "fr", "ar"]).optional(),
});

export const cancelBookingSchema = z.object({
  reference: z.string().min(1),
});

export const customTourSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: emailSchema,
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: z.number().int().min(1).max(30),
  travelers: z.number().int().min(1).max(40),
  travelStyle: z.enum(["solo", "couple", "family", "friends", "group"]),
  budget: z.enum(["economy", "comfort", "premium"]),
  interests: z.array(z.string().min(1).max(40)).max(8),
  destinations: z.string().trim().max(400).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  locale: z.string().max(5).optional(),
});
