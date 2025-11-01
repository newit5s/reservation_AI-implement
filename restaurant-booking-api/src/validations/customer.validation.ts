import { CustomerTier } from '@prisma/client';
import { z } from 'zod';

export const customerListQuerySchema = z.object({
  query: z.object({
    tier: z.union([z.nativeEnum(CustomerTier), z.literal('BLACKLISTED')]).optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().optional(),
  }),
});

export const customerIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const createCustomerSchema = z.object({
  body: z.object({
    fullName: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().min(6).max(20).optional(),
    notes: z.string().optional(),
    referredById: z.string().uuid().nullable().optional(),
    preferences: z.record(z.string()).optional(),
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    fullName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(6).max(20).optional(),
    notes: z.string().optional(),
    referredById: z.string().uuid().nullable().optional(),
    preferences: z.record(z.string()).optional(),
  }),
});

export const customerNoteSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ note: z.string().min(1) }),
});

export const customerPreferenceSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    dietaryRestrictions: z.array(z.string()).optional(),
    favoriteTable: z.string().optional(),
    specialOccasions: z.array(z.string()).optional(),
    preferredCommunication: z.string().optional(),
    custom: z.record(z.string()).optional(),
  }),
});

export const blacklistSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ reason: z.string().min(3) }),
});

export const searchCustomersQuerySchema = z.object({
  query: z.object({ term: z.string().min(1) }),
});

export const mergeCustomersSchema = z.object({
  body: z.object({
    primaryId: z.string().uuid(),
    duplicateId: z.string().uuid(),
  }),
});

export const adjustPointsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    points: z.number().int(),
    reason: z.string().min(3),
  }),
});

export const redeemRewardSchema = z.object({
  body: z.object({
    customerId: z.string().uuid(),
    rewardId: z.string().uuid(),
  }),
});

export type CustomerListQuery = z.infer<typeof customerListQuerySchema>['query'];
export type CreateCustomerBody = z.infer<typeof createCustomerSchema>['body'];
export type UpdateCustomerBody = z.infer<typeof updateCustomerSchema>['body'];
export type CustomerNoteBody = z.infer<typeof customerNoteSchema>['body'];
export type CustomerPreferenceBody = z.infer<typeof customerPreferenceSchema>['body'];
export type BlacklistBody = z.infer<typeof blacklistSchema>['body'];
export type MergeCustomersBody = z.infer<typeof mergeCustomersSchema>['body'];
export type AdjustPointsBody = z.infer<typeof adjustPointsSchema>['body'];
export type RedeemRewardBody = z.infer<typeof redeemRewardSchema>['body'];
export type SearchCustomersQuery = z.infer<typeof searchCustomersQuerySchema>['query'];
