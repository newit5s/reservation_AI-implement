import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { BranchService } from '../services/branch.service';
import { AuthenticatedRequest } from '../types/requests';
import { PaginationOptions } from '../types';
import { combineDateAndTimeString, timeStringToDate } from '../utils/helpers';

const branchService = new BranchService();

const normaliseTimeInput = (value: string | Date | null | undefined): Date | null => {
  if (typeof value === 'string') {
    return timeStringToDate(value);
  }
  if (value instanceof Date) {
    return value;
  }
  return null;
};

export class BranchController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const options: PaginationOptions = {
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
    };
    const rawIsActive = req.query.isActive;
    const filters = {
      search: req.query.search as string | undefined,
      isActive:
        typeof rawIsActive === 'string'
          ? rawIsActive === 'true'
          : typeof rawIsActive === 'boolean'
          ? rawIsActive
          : undefined,
    };
    const result = await branchService.listBranches(req.user, options, filters);
    res.json(result);
  }

  static async get(req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> {
    const branch = await branchService.getBranch(req.user, req.params.id);
    res.json(branch);
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { settings, operatingHours, ...branchData } = req.body as {
      settings?: Prisma.SettingUncheckedCreateInput[];
      operatingHours?: Prisma.OperatingHourUncheckedCreateInput[];
    } & Prisma.BranchUncheckedCreateInput;
    const branch = await branchService.createBranch(
      req.user,
      branchData
    );

    if (Array.isArray(settings) && settings.length > 0) {
      const settingsPayload = settings;
      await branchService.updateBranchSettings(
        req.user,
        branch.id,
        settingsPayload.map((setting) => ({ ...setting, branchId: branch.id }))
      );
    }

    if (Array.isArray(operatingHours) && operatingHours.length > 0) {
      const hoursPayload = operatingHours;
      await branchService.updateOperatingHours(
        req.user,
        branch.id,
        hoursPayload.map((hour) => ({
          ...hour,
          branchId: branch.id,
          openTime: normaliseTimeInput(hour.openTime),
          closeTime: normaliseTimeInput(hour.closeTime),
          breakStart: normaliseTimeInput(hour.breakStart),
          breakEnd: normaliseTimeInput(hour.breakEnd),
        }))
      );
    }

    res.status(201).json(branch);
  }

  static async update(req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> {
    const updatePayload = req.body as Prisma.BranchUpdateInput;
    const branch = await branchService.updateBranch(req.user, req.params.id, updatePayload);
    res.json(branch);
  }

  static async remove(req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> {
    await branchService.softDeleteBranch(req.user, req.params.id);
    res.status(204).send();
  }

  static async getSettings(
    req: AuthenticatedRequest<{ id: string }>,
    res: Response
  ): Promise<void> {
    const settings = await branchService.getBranchSettings(req.user, req.params.id);
    res.json(settings);
  }

  static async updateSettings(
    req: AuthenticatedRequest<{ id: string }>,
    res: Response
  ): Promise<void> {
    const { settings = [] } = req.body as {
      settings?: Prisma.SettingUncheckedCreateInput[];
    };
    await branchService.updateBranchSettings(req.user, req.params.id, settings);
    res.json({ message: 'Settings updated' });
  }

  static async getOperatingHours(
    req: AuthenticatedRequest<{ id: string }>,
    res: Response
  ): Promise<void> {
    const hours = await branchService.getOperatingHours(req.user, req.params.id);
    res.json(hours);
  }

  static async updateOperatingHours(
    req: AuthenticatedRequest<{ id: string }>,
    res: Response
  ): Promise<void> {
    const { operatingHours = [] } = req.body as {
      operatingHours?: Prisma.OperatingHourUncheckedCreateInput[];
    };
    await branchService.updateOperatingHours(
      req.user,
      req.params.id,
      operatingHours.map((hour) => ({
        ...hour,
        branchId: req.params.id,
        openTime: normaliseTimeInput(hour.openTime),
        closeTime: normaliseTimeInput(hour.closeTime),
          breakStart: normaliseTimeInput(hour.breakStart),
          breakEnd: normaliseTimeInput(hour.breakEnd),
        }))
      );
    res.json({ message: 'Operating hours updated' });
  }

  static async listBlockedSlots(
    req: AuthenticatedRequest<{ id: string }>,
    res: Response
  ): Promise<void> {
    const slots = await branchService.listBlockedSlots(req.user, req.params.id);
    res.json(slots);
  }

  static async createBlockedSlot(
    req: AuthenticatedRequest<{ id: string }>,
    res: Response
  ): Promise<void> {
    const payload = req.body as {
      date: string;
      startTime: string;
      endTime: string;
      reason?: string;
    };
    const slot = await branchService.createBlockedSlot(req.user, {
      branchId: req.params.id,
      date: new Date(payload.date),
      startTime: combineDateAndTimeString(payload.date, payload.startTime),
      endTime: combineDateAndTimeString(payload.date, payload.endTime),
      reason: payload.reason,
      createdById: req.user.id,
    });
    res.status(201).json(slot);
  }

  static async deleteBlockedSlots(
    req: AuthenticatedRequest<{ id: string }>,
    res: Response
  ): Promise<void> {
    const { ids = [] } = req.body as { ids?: string[] };
    await branchService.removeBlockedSlots(req.user, req.params.id, ids);
    res.status(204).send();
  }
}
