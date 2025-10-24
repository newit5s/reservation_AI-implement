import { Prisma, SettingValueType } from '@prisma/client';
import { BranchRepository } from '../repositories/branch.repository';
import { OperatingHourRepository } from '../repositories/operating-hour.repository';
import { BlockedSlotRepository } from '../repositories/blocked-slot.repository';
import { SettingRepository } from '../repositories/setting.repository';
import { PaginationOptions } from '../types';
import { AuthUser } from '../types/auth';
import { PermissionService } from './permission.service';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';
import { timeStringToDate } from '../utils/helpers';

interface BranchFilters {
  search?: string;
  isActive?: boolean;
}

export class BranchService {
  private branchRepository: BranchRepository;
  private operatingHourRepository: OperatingHourRepository;
  private blockedSlotRepository: BlockedSlotRepository;
  private settingRepository: SettingRepository;

  constructor() {
    this.branchRepository = new BranchRepository();
    this.operatingHourRepository = new OperatingHourRepository();
    this.blockedSlotRepository = new BlockedSlotRepository();
    this.settingRepository = new SettingRepository();
  }

  async listBranches(user: AuthUser, options: PaginationOptions, filters: BranchFilters = {}) {
    const accessible = PermissionService.getAccessibleBranches(user);
    if (Array.isArray(accessible) && accessible.length === 0) {
      return {
        data: [],
        total: 0,
        page: options.page ?? 1,
        pageSize: options.pageSize ?? 20,
      };
    }

    const where: Prisma.BranchWhereInput = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (Array.isArray(accessible)) {
      where.id = { in: accessible };
    }

    return this.branchRepository.list(options, where);
  }

  async getBranch(user: AuthUser, id: string) {
    PermissionService.assertPermission(user, 'branches', 'read', id);
    const branch = await this.branchRepository.findWithDetails(id);
    if (!branch) {
      throw new AppError('Branch not found', 404);
    }
    return branch;
  }

  async createBranch(user: AuthUser, data: Prisma.BranchUncheckedCreateInput) {
    PermissionService.assertPermission(user, 'branches', 'create');
    const branch = await this.branchRepository.create({
      ...data,
      email: data.email ? data.email.toLowerCase() : undefined,
      settings: undefined,
      operatingHours: undefined,
    } as Prisma.BranchUncheckedCreateInput);
    logger.info('Branch created', { branchId: branch.id, userId: user.id });
    return branch;
  }

  async updateBranch(user: AuthUser, id: string, data: Prisma.BranchUpdateInput) {
    PermissionService.assertPermission(user, 'branches', 'update', id);
    const existing = await this.branchRepository.findById(id);
    if (!existing) {
      throw new AppError('Branch not found', 404);
    }

    const updateData: Prisma.BranchUpdateInput = { ...data };
    if (typeof data.email === 'string') {
      updateData.email = data.email.toLowerCase();
    }
    const branch = await this.branchRepository.update(id, updateData);
    logger.info('Branch updated', { branchId: id, userId: user.id });
    return branch;
  }

  async softDeleteBranch(user: AuthUser, id: string) {
    PermissionService.assertPermission(user, 'branches', 'delete', id);
    const existing = await this.branchRepository.findById(id);
    if (!existing) {
      throw new AppError('Branch not found', 404);
    }
    await this.branchRepository.update(id, { isActive: false });
    logger.info('Branch soft deleted', { branchId: id, userId: user.id });
  }

  async getBranchSettings(user: AuthUser, id: string) {
    PermissionService.assertPermission(user, 'branches', 'settings', id);
    const branch = await this.branchRepository.findWithDetails(id);
    if (!branch) {
      throw new AppError('Branch not found', 404);
    }
    return branch.settingsEntries;
  }

  async updateBranchSettings(
    user: AuthUser,
    id: string,
    settings: Prisma.SettingUncheckedCreateInput[]
  ): Promise<void> {
    PermissionService.assertPermission(user, 'branches', 'settings', id);
    await this.settingRepository.upsertMany(
      settings.map((setting) => ({
        ...setting,
        branchId: id,
        valueType: (setting.valueType as SettingValueType | undefined) ?? SettingValueType.STRING,
      }))
    );
    logger.info('Branch settings updated', { branchId: id, userId: user.id });
  }

  async getOperatingHours(user: AuthUser, id: string) {
    PermissionService.assertPermission(user, 'branches', 'operatingHours', id);
    const branch = await this.branchRepository.findWithDetails(id);
    if (!branch) {
      throw new AppError('Branch not found', 404);
    }
    return branch.operatingHours;
  }

  async updateOperatingHours(
    user: AuthUser,
    id: string,
    hours: Prisma.OperatingHourUncheckedCreateInput[]
  ): Promise<void> {
    PermissionService.assertPermission(user, 'branches', 'operatingHours', id);
    await this.operatingHourRepository.upsertMany(
      id,
      hours.map((hour) => ({
        ...hour,
        branchId: id,
        openTime:
          typeof hour.openTime === 'string' ? timeStringToDate(hour.openTime) : hour.openTime,
        closeTime:
          typeof hour.closeTime === 'string' ? timeStringToDate(hour.closeTime) : hour.closeTime,
        breakStart:
          typeof hour.breakStart === 'string' ? timeStringToDate(hour.breakStart) : hour.breakStart,
        breakEnd:
          typeof hour.breakEnd === 'string' ? timeStringToDate(hour.breakEnd) : hour.breakEnd,
      }))
    );
    logger.info('Branch operating hours updated', { branchId: id, userId: user.id });
  }

  async listBlockedSlots(user: AuthUser, id: string) {
    PermissionService.assertPermission(user, 'branches', 'blockedSlots', id);
    const branch = await this.branchRepository.findWithDetails(id);
    if (!branch) {
      throw new AppError('Branch not found', 404);
    }
    return branch.blockedSlots;
  }

  async createBlockedSlot(user: AuthUser, data: Prisma.BlockedSlotUncheckedCreateInput) {
    PermissionService.assertPermission(user, 'blockedSlots', 'manage', data.branchId);
    const slot = await this.blockedSlotRepository.create(data);
    logger.info('Blocked slot created', {
      slotId: slot.id,
      branchId: data.branchId,
      userId: user.id,
    });
    return slot;
  }

  async removeBlockedSlots(user: AuthUser, branchId: string, ids: string[]): Promise<void> {
    PermissionService.assertPermission(user, 'blockedSlots', 'manage', branchId);
    await this.blockedSlotRepository.removeByBranch(branchId, ids);
    logger.info('Blocked slots removed', { branchId, ids, userId: user.id });
  }
}
