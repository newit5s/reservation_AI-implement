import { Response } from 'express';
import { TableService } from '../services/table.service';
import { AuthenticatedRequest } from '../types/requests';
import { timeStringToDate } from '../utils/helpers';
import { AppError } from '../utils/app-error';

const tableService = new TableService();

export class TableController {
  static async list(req: AuthenticatedRequest<{ branchId: string }>, res: Response): Promise<void> {
    const tables = await tableService.listTables(req.user, req.params.branchId);
    res.json(tables);
  }

  static async create(
    req: AuthenticatedRequest<{ branchId: string }>,
    res: Response
  ): Promise<void> {
    const table = await tableService.createTable(req.user, {
      ...req.body,
      branchId: req.params.branchId,
    });
    res.status(201).json(table);
  }

  static async update(req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> {
    const table = await tableService.updateTable(req.user, req.params.id, req.body);
    res.json(table);
  }

  static async remove(req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> {
    await tableService.deleteTable(req.user, req.params.id);
    res.status(204).send();
  }

  static async updateStatus(
    req: AuthenticatedRequest<{ id: string }>,
    res: Response
  ): Promise<void> {
    const table = await tableService.updateStatus(req.user, {
      id: req.params.id,
      ...req.body,
    });
    res.json(table);
  }

  static async availability(
    req: AuthenticatedRequest<{ id: string }>,
    res: Response
  ): Promise<void> {
    const result = await tableService.getAvailability(req.user, req.params.id, {
      date: new Date(req.query.date as string),
      time: (() => {
        const parsed = timeStringToDate(req.query.time as string);
        if (!parsed) {
          throw new AppError('Invalid time format', 400);
        }
        return parsed;
      })(),
    });
    res.json(result);
  }

  static async bulkAvailability(req: AuthenticatedRequest, res: Response): Promise<void> {
    const time = timeStringToDate(req.body.time);
    if (!time) {
      throw new AppError('Invalid time format', 400);
    }
    const result = await tableService.checkAvailability(req.user, {
      branchId: req.body.branchId,
      date: new Date(req.body.date),
      time,
      partySize: req.body.partySize,
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
    req: AuthenticatedRequest<{ branchId: string }>,
    res: Response
  ): Promise<void> {
    await tableService.updateLayout(req.user, req.params.branchId, req.body.layout);
    res.json({ message: 'Layout updated' });
  }

  static async combine(req: AuthenticatedRequest, res: Response): Promise<void> {
    const result = await tableService.combineTables(req.user, req.body.branchId, req.body.tableIds);
    res.json(result);
  }
}
