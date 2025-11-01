import { Prisma, Table, TableType } from '@prisma/client';
import { TableRepository } from '../repositories/table.repository';
import { PermissionService } from './permission.service';
import { AuthUser } from '../types/auth';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';
import { DatabaseService } from './database.service';
import { TableModel, BranchModel } from '../models';
import { TableEvents } from './tableEvents.service';

interface AvailabilityRequest {
  branchId?: string;
  date: Date;
  time: Date;
  durationMinutes?: number;
  partySize?: number;
}

interface LayoutUpdate {
  id: string;
  positionX?: number | null;
  positionY?: number | null;
  floor?: number;
}

interface TableStatusUpdate {
  id: string;
  isActive?: boolean;
  isCombinable?: boolean;
}

export class TableService {
  private tableRepository: TableRepository;

  constructor() {
    this.tableRepository = new TableRepository();
  }

  async listTables(user: AuthUser, branchId: string): Promise<Table[]> {
    PermissionService.assertPermission(user, 'tables', 'read', branchId);
    return this.tableRepository.findByBranch(branchId);
  }

  async createTable(user: AuthUser, data: Prisma.TableUncheckedCreateInput): Promise<Table> {
    PermissionService.assertPermission(user, 'tables', 'create', data.branchId);
    const table = await this.tableRepository.create({
      ...data,
      tableType: (data.tableType as TableType | undefined) ?? TableType.REGULAR,
    });
    TableEvents.tableUpdated(data.branchId, table);
    logger.info('Table created', { tableId: table.id, branchId: data.branchId, userId: user.id });
    return table;
  }

  async updateTable(
    user: AuthUser,
    id: string,
    data: Partial<Prisma.TableUncheckedCreateInput>
  ): Promise<Table> {
    const existing = await this.tableRepository.findById(id);
    if (!existing) {
      throw new AppError('Table not found', 404);
    }
    PermissionService.assertPermission(user, 'tables', 'update', existing.branchId);
    const updateData: Prisma.TableUpdateInput = {};
    if (data.tableNumber !== undefined) {
      updateData.tableNumber = data.tableNumber;
    }
    if (data.capacity !== undefined) {
      updateData.capacity = data.capacity;
    }
    if (data.minCapacity !== undefined) {
      updateData.minCapacity = data.minCapacity;
    }
    if (data.tableType !== undefined) {
      updateData.tableType = { set: data.tableType as TableType };
    }
    if (data.positionX !== undefined) {
      updateData.positionX = data.positionX;
    }
    if (data.positionY !== undefined) {
      updateData.positionY = data.positionY;
    }
    if (data.floor !== undefined) {
      updateData.floor = data.floor;
    }
    if (data.isCombinable !== undefined) {
      updateData.isCombinable = data.isCombinable;
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }
    const updated = await this.tableRepository.update(id, updateData);
    TableEvents.tableUpdated(existing.branchId, updated);
    logger.info('Table updated', { tableId: id, branchId: existing.branchId, userId: user.id });
    return updated;
  }

  async deleteTable(user: AuthUser, id: string): Promise<void> {
    const existing = (await this.tableRepository.findById(id)) as Table | null;
    if (!existing) {
      throw new AppError('Table not found', 404);
    }
    PermissionService.assertPermission(user, 'tables', 'delete', existing.branchId);
    await this.tableRepository.delete(id);
    TableEvents.tableRemoved(existing.branchId, id);
    logger.info('Table deleted', { tableId: id, branchId: existing.branchId, userId: user.id });
  }

  async updateStatus(user: AuthUser, payload: TableStatusUpdate): Promise<Table> {
    const existing = await this.tableRepository.findById(payload.id);
    if (!existing) {
      throw new AppError('Table not found', 404);
    }
    PermissionService.assertPermission(user, 'tables', 'status', existing.branchId);
    const updated = await this.tableRepository.update(payload.id, {
      isActive: payload.isActive ?? existing.isActive,
      isCombinable: payload.isCombinable ?? existing.isCombinable,
    });
    TableEvents.tableUpdated(existing.branchId, updated);
    return updated;
  }

  async getAvailability(user: AuthUser, tableId: string, request: AvailabilityRequest) {
    const table = await this.tableRepository.findById(tableId);
    if (!table) {
      throw new AppError('Table not found', 404);
    }
    PermissionService.assertPermission(user, 'tables', 'availability', table.branchId);
    const available = await TableModel.isAvailable(tableId, request.date, request.time);
    return { tableId, available };
  }

  async checkAvailability(user: AuthUser, request: AvailabilityRequest) {
    if (!request.branchId) {
      throw new AppError('Branch ID is required', 400);
    }
    PermissionService.assertPermission(user, 'tables', 'availability', request.branchId);
    const partySize = request.partySize ?? 1;
    const availableTables = await BranchModel.getAvailableTables(
      request.branchId,
      request.date,
      request.time,
      partySize
    );
    return availableTables;
  }

  async getLayout(user: AuthUser, branchId: string) {
    PermissionService.assertPermission(user, 'tables', 'layout', branchId);
    return this.tableRepository.findByBranch(branchId);
  }

  async updateLayout(user: AuthUser, branchId: string, layout: LayoutUpdate[]): Promise<void> {
    PermissionService.assertPermission(user, 'tables', 'layout', branchId);
    const currentTables = await this.tableRepository.findByBranch(branchId);
    const tableIds = new Set(currentTables.map((table) => table.id));
    const invalid = layout.find((item) => !tableIds.has(item.id));
    if (invalid) {
      throw new AppError('One or more tables do not belong to the branch', 400);
    }
    const prisma = DatabaseService.getClient();
    const updates = layout.map((item) =>
      prisma.table.update({
        where: { id: item.id },
        data: {
          positionX: item.positionX ?? null,
          positionY: item.positionY ?? null,
          floor: item.floor ?? 1,
        },
      })
    );
    await prisma.$transaction(updates);
    const tables = await this.tableRepository.findByBranch(branchId);
    TableEvents.layoutUpdated(branchId, tables);
  }

  async combineTables(user: AuthUser, branchId: string, tableIds: string[]) {
    PermissionService.assertPermission(user, 'tables', 'combine', branchId);
    if (tableIds.length < 2) {
      throw new AppError('At least two tables are required to combine', 400);
    }

    const tables = await this.tableRepository.findMany({
      where: { id: { in: tableIds }, branchId },
    });

    if (tables.length !== tableIds.length) {
      throw new AppError('Some tables could not be found in the branch', 400);
    }

    const nonCombinable = tables.filter((table) => !table.isCombinable);
    if (nonCombinable.length > 0) {
      throw new AppError('One or more tables cannot be combined', 400);
    }

    const capacity = tables.reduce((sum, table) => sum + table.capacity, 0);
    return { tableIds, capacity, branchId };
  }
}
