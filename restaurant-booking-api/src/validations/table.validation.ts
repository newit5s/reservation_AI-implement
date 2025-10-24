import { z } from 'zod';

export const tableIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const branchTablesParamSchema = z.object({
  params: z.object({ branchId: z.string().uuid() }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

const tableBaseSchema = z
  .object({
    branchId: z.string().uuid(),
    tableNumber: z.string().min(1),
    capacity: z.number().int().positive(),
    minCapacity: z.number().int().positive().optional(),
    tableType: z.string().optional(),
    positionX: z.number().int().optional(),
    positionY: z.number().int().optional(),
    floor: z.number().int().positive().optional(),
    isCombinable: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => (data.minCapacity ? data.minCapacity <= data.capacity : true), {
    message: 'Minimum capacity must be less than or equal to capacity',
    path: ['minCapacity'],
  });

export const createTableSchema = z.object({
  params: z.object({ branchId: z.string().uuid() }),
  body: tableBaseSchema.omit({ branchId: true }).partial({ branchId: true }),
});

export const updateTableSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: tableBaseSchema.partial(),
});

export const updateStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    isActive: z.boolean().optional(),
    isCombinable: z.boolean().optional(),
  }),
});

export const tableAvailabilityQuerySchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  query: z.object({
    date: z.string(),
    time: z.string(),
  }),
  body: z.object({}).optional(),
});

export const bulkAvailabilitySchema = z.object({
  body: z.object({
    branchId: z.string().uuid(),
    date: z.string(),
    time: z.string(),
    partySize: z.number().int().positive().optional(),
  }),
});

export const updateLayoutSchema = z.object({
  params: z.object({ branchId: z.string().uuid() }),
  body: z.object({
    layout: z.array(
      z.object({
        id: z.string().uuid(),
        positionX: z.number().int().nullable().optional(),
        positionY: z.number().int().nullable().optional(),
        floor: z.number().int().positive().optional(),
      })
    ),
  }),
});

export const combineTablesSchema = z.object({
  body: z.object({
    branchId: z.string().uuid(),
    tableIds: z.array(z.string().uuid()).min(2),
  }),
});
