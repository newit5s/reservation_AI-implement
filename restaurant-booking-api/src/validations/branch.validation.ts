import { z } from 'zod';

const branchBaseSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
});

export const listBranchesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    search: z.string().optional(),
    isActive: z
      .string()
      .optional()
      .transform((value) => (value === undefined ? undefined : value === 'true')),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const createBranchSchema = z.object({
  body: branchBaseSchema.extend({
    settings: z
      .array(
        z.object({
          scope: z.string(),
          category: z.string(),
          key: z.string(),
          value: z.string(),
          valueType: z.string().optional(),
        })
      )
      .optional(),
    operatingHours: z
      .array(
        z.object({
          dayOfWeek: z.number().min(0).max(6),
          openTime: z.string().optional(),
          closeTime: z.string().optional(),
          breakStart: z.string().optional(),
          breakEnd: z.string().optional(),
          isClosed: z.boolean().optional(),
        })
      )
      .optional(),
  }),
});

export const updateBranchSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: branchBaseSchema.partial(),
});

export const branchIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateSettingsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    settings: z.array(
      z.object({
        scope: z.string(),
        category: z.string(),
        key: z.string(),
        value: z.string(),
        valueType: z.string().optional(),
      })
    ),
  }),
});

export const updateOperatingHoursSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    operatingHours: z.array(
      z.object({
        dayOfWeek: z.number().min(0).max(6),
        openTime: z.string().optional(),
        closeTime: z.string().optional(),
        breakStart: z.string().optional(),
        breakEnd: z.string().optional(),
        isClosed: z.boolean().optional(),
      })
    ),
  }),
});

export const createBlockedSlotSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    reason: z.string().optional(),
  }),
});

export const deleteBlockedSlotsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ ids: z.array(z.string().uuid()) }),
});
