import { TableType } from '@prisma/client';
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

const tableBaseShape = {
  branchId: z.string().uuid(),
  tableNumber: z.string().min(1),
  capacity: z.number().int().positive(),
  minCapacity: z.number().int().positive().optional(),
  tableType: z.nativeEnum(TableType).optional(),
  positionX: z.number().int().optional(),
  positionY: z.number().int().optional(),
  floor: z.number().int().positive().optional(),
  isCombinable: z.boolean().optional(),
  isActive: z.boolean().optional(),
} as const;

const withCapacityValidation = <TSchema extends z.ZodTypeAny>(schema: TSchema) =>
  schema.superRefine((data, ctx) => {
    const { capacity, minCapacity } = data as { capacity?: number | null; minCapacity?: number | null };
    if (minCapacity != null && capacity != null && minCapacity > capacity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimum capacity must be less than or equal to capacity',
        path: ['minCapacity'],
      });
    }
  });

const tableBaseSchema = withCapacityValidation(z.object(tableBaseShape));
const createTableBodySchema = withCapacityValidation(z.object(tableBaseShape).omit({ branchId: true }));
const updateTableBodySchema = withCapacityValidation(z.object(tableBaseShape).partial());

export type TableBaseInput = z.infer<typeof tableBaseSchema>;
export type CreateTableBody = z.infer<typeof createTableBodySchema>;
export type UpdateTableBody = z.infer<typeof updateTableBodySchema>;

export const createTableSchema = z.object({
  params: z.object({ branchId: z.string().uuid() }),
  body: createTableBodySchema,
});

export const updateTableSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: updateTableBodySchema,
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

export type UpdateStatusBody = z.infer<typeof updateStatusSchema>['body'];
export type TableAvailabilityQuery = z.infer<typeof tableAvailabilityQuerySchema>['query'];
export type BulkAvailabilityBody = z.infer<typeof bulkAvailabilitySchema>['body'];
export type UpdateLayoutBody = z.infer<typeof updateLayoutSchema>['body'];
export type CombineTablesBody = z.infer<typeof combineTablesSchema>['body'];
