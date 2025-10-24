import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10),
  }),
});

export const passwordResetRequestSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const passwordResetSchema = z.object({
  body: z.object({
    token: z.string().min(10),
    password: z.string().min(8),
  }),
});
