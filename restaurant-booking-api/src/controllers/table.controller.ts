import { Response } from 'express';
import { TableService } from '../services/table.service';
import { AuthenticatedRequest } from '../types/requests';
import { timeStringToDate } from '../utils/helpers';
import { AppError } from '../utils/app-error';
import {
  BulkAvailabilityBody,
  CombineTablesBody,
  CreateTableBody,
  TableAvailabilityQuery,
  UpdateLayoutBody,
  UpdateStatusBody,
  UpdateTableBody,
} from '../validations/table.validation';

const tableService = new TableService();

export class TableController {
  static async list(req: AuthenticatedRequest<{ branchId: string }>, res: Response): Promise<void> {
    const tables = await tableService.listTables(req.user, req.params.branchId);
    res.json(tables);
  }

  static async create(
    req: AuthenticatedRequest<{ branchId: string }, unknown, CreateTableBody>,
    res: Response
  ): Promise<void> {
    const payload: CreateTableBody = req.body;
    const table = await tableService.createTable(req.user, {
      ...payload,
      branchId: req.params.branchId,
    });
    res.status(201).json(table);
  }

  static async update(
    req: AuthenticatedRequest<{ id: string }, unknown, UpdateTableBody>,
    res: Response
  ): Promise<void> {
    const payload: UpdateTableBody = req.body;
    const table = await tableService.updateTable(req.user, req.params.id, payload);
    res.json(table);
  }

  static async remove(req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> {
    await tableService.deleteTable(req.user, req.params.id);
    res.status(204).send();
  }

  static async updateStatus(
    req: AuthenticatedRequest<{ id: string }, unknown, UpdateStatusBody>,
    res: Response
  ): Promise<void> {
    const payload: UpdateStatusBody = req.body;
    const table = await tableService.updateStatus(req.user, {
      id: req.params.id,
      ...payload,
    });
    res.json(table);
  }

  static async availability(
    req: AuthenticatedRequest<{ id: string }, unknown, unknown, TableAvailabilityQuery>,
    res: Response
  ): Promise<void> {
    const query: TableAvailabilityQuery = req.query;
    const result = await tableService.getAvailability(req.user, req.params.id, {
      date: new Date(query.date),
      time: (() => {
        const parsed = timeStringToDate(query.time);
        if (!parsed) {
          throw new AppError('Invalid time format', 400);
        }
        return parsed;
      })(),
    });
    res.json(result);
  }

  static async bulkAvailability(
    req: AuthenticatedRequest<Record<string, never>, unknown, BulkAvailabilityBody>,
    res: Response
  ): Promise<void> {
    const payload: BulkAvailabilityBody = req.body;
    const time = timeStringToDate(payload.time);
    if (!time) {
      throw new AppError('Invalid time format', 400);
    }
    const result = await tableService.checkAvailability(req.user, {
      branchId: payload.branchId,
      date: new Date(payload.date),
      time,
      partySize: payload.partySize,
    });
    res.json(result);
  }

  static async layout(
    req: AuthenticatedRequest<{ branchId: string }>,
    res: Response
  ): Promise<void> {
    const layout = await tableService.getLayout(req.user, req.params.branchId);
    res.json(layout);
  }

  static async updateLayout(
    req: AuthenticatedRequest<{ branchId: string }, unknown, UpdateLayoutBody>,
    res: Response
  ): Promise<void> {
    const payload: UpdateLayoutBody = req.body;
    await tableService.updateLayout(req.user, req.params.branchId, payload.layout);
    res.json({ message: 'Layout updated' });
  }

  static async combine(
    req: AuthenticatedRequest<Record<string, never>, unknown, CombineTablesBody>,
    res: Response
  ): Promise<void> {
    const payload: CombineTablesBody = req.body;
    const result = await tableService.combineTables(req.user, payload.branchId, payload.tableIds);
    res.json(result);
  }
}
