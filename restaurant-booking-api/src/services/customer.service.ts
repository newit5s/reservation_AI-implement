import { CustomerTier, Prisma, TimelineEventType } from '@prisma/client';
import { customerRepository } from '../repositories/customer.repository';
import { PermissionService } from './permission.service';
import { AuthUser } from '../types/auth';
import { AppError } from '../utils/app-error';
import { DatabaseService } from './database.service';
import { buildPaginatedResult, getPagination } from '../utils/helpers';
import { CustomerModel } from '../models';
import { LoyaltyService } from './loyalty.service';

interface CustomerFilters {
  tier?: CustomerTier | 'BLACKLISTED';
  search?: string;
  page?: number;
  pageSize?: number;
}

interface CustomerPayload {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  preferences?: Record<string, string>;
  referredById?: string | null;
}

interface PreferencePayload {
  dietaryRestrictions?: string[];
  favoriteTable?: string;
  specialOccasions?: string[];
  preferredCommunication?: string;
  custom?: Record<string, string>;
}

export class CustomerService {
  private toPreferencesJson(
    next: Record<string, string> | undefined,
    fallback: Prisma.JsonValue | null = {}
  ): Prisma.InputJsonValue {
    if (next !== undefined) {
      return next as Prisma.InputJsonValue;
    }
    if (fallback === null) {
      return {} as Prisma.InputJsonValue;
    }
    return (fallback ?? {}) as Prisma.InputJsonValue;
  }

  async list(user: AuthUser, filters: CustomerFilters) {
    PermissionService.assertPermission(user, 'customers', 'read', user.branchId ?? undefined);
    const prisma = DatabaseService.getClient();
    const { skip, take } = getPagination({ page: filters.page, pageSize: filters.pageSize });
    const where: Prisma.CustomerWhereInput = {};

    if (filters.tier === 'BLACKLISTED') {
      where.isBlacklisted = true;
    } else if (filters.tier) {
      where.tier = filters.tier;
    }

    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { fullName: 'asc' },
        include: { loyaltyAccount: true },
      }),
      prisma.customer.count({ where }),
    ]);

    return buildPaginatedResult(data, total, { page: filters.page, pageSize: filters.pageSize });
  }

  async get(user: AuthUser, id: string) {
    PermissionService.assertPermission(user, 'customers', 'read', user.branchId ?? undefined);
    const prisma = DatabaseService.getClient();
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        loyaltyAccount: true,
        preferencesEntries: true,
      },
    });
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }
    return customer;
  }

  async create(user: AuthUser, payload: CustomerPayload) {
    PermissionService.assertPermission(user, 'customers', 'create', user.branchId ?? undefined);
    const prisma = DatabaseService.getClient();
    const customer = await prisma.customer.create({
      data: {
        fullName: payload.fullName,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        notes: payload.notes ?? null,
        referredById: payload.referredById ?? null,
        preferences: this.toPreferencesJson(payload.preferences),
      },
    });
    await LoyaltyService.ensureAccount(customer.id);
    await CustomerModel.recordTimeline(
      customer.id,
      TimelineEventType.BOOKING_CREATED,
      'Customer profile created',
      {},
      user.id
    );
    return customer;
  }

  async update(user: AuthUser, id: string, payload: Partial<CustomerPayload>) {
    PermissionService.assertPermission(user, 'customers', 'update', user.branchId ?? undefined);
    const existing = await customerRepository.findById(id);
    if (!existing) {
      throw new AppError('Customer not found', 404);
    }
    const updated = await customerRepository.update(id, {
      fullName: payload.fullName ?? existing.fullName,
      email: payload.email ?? existing.email,
      phone: payload.phone ?? existing.phone,
      notes: payload.notes ?? existing.notes,
      preferences: this.toPreferencesJson(payload.preferences, existing.preferences),
    });
    await CustomerModel.recordTimeline(
      id,
      TimelineEventType.BOOKING_UPDATED,
      'Customer profile updated',
      {},
      user.id
    );
    return updated;
  }

  async getBookings(user: AuthUser, id: string) {
    PermissionService.assertPermission(user, 'customers', 'read', user.branchId ?? undefined);
    const prisma = DatabaseService.getClient();
    return prisma.booking.findMany({
      where: { customerId: id },
      orderBy: [{ bookingDate: 'desc' }, { timeSlot: 'desc' }],
    });
  }

  async addNote(user: AuthUser, id: string, note: string) {
    PermissionService.assertPermission(user, 'customers', 'update', user.branchId ?? undefined);
    const prisma = DatabaseService.getClient();
    const created = await prisma.customerNote.create({
      data: {
        customerId: id,
        content: note,
        createdById: user.id,
      },
    });
    await CustomerModel.recordTimeline(
      id,
      TimelineEventType.NOTE_ADDED,
      'Internal note added',
      { noteId: created.id },
      user.id
    );
    return created;
  }

  async updatePreferences(user: AuthUser, id: string, payload: PreferencePayload) {
    PermissionService.assertPermission(user, 'customers', 'update', user.branchId ?? undefined);
    const prisma = DatabaseService.getClient();
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const preferences = {
      ...(customer.preferences as Record<string, string>),
      dietaryRestrictions: payload.dietaryRestrictions ?? [],
      favoriteTable: payload.favoriteTable ?? null,
      specialOccasions: payload.specialOccasions ?? [],
      preferredCommunication: payload.preferredCommunication ?? null,
      ...(payload.custom ?? {}),
    };

    await prisma.customer.update({
      where: { id },
      data: { preferences },
    });

    await CustomerModel.recordTimeline(
      id,
      TimelineEventType.BOOKING_UPDATED,
      'Preferences updated',
      preferences,
      user.id
    );

    return preferences;
  }

  async blacklist(user: AuthUser, id: string, reason: string) {
    PermissionService.assertPermission(user, 'customers', 'blacklist', user.branchId ?? undefined);
    const prisma = DatabaseService.getClient();
    const customer = await prisma.customer.update({
      where: { id },
      data: { isBlacklisted: true, blacklistReason: reason },
    });
    await CustomerModel.recordTimeline(
      id,
      TimelineEventType.BLACKLISTED,
      'Customer blacklisted',
      { reason },
      user.id
    );
    return customer;
  }

  async removeBlacklist(user: AuthUser, id: string) {
    PermissionService.assertPermission(user, 'customers', 'blacklist', user.branchId ?? undefined);
    const prisma = DatabaseService.getClient();
    const customer = await prisma.customer.update({
      where: { id },
      data: { isBlacklisted: false, blacklistReason: null },
    });
    await CustomerModel.recordTimeline(
      id,
      TimelineEventType.BLACKLIST_REMOVED,
      'Customer removed from blacklist',
      {},
      user.id
    );
    return customer;
  }

  async search(user: AuthUser, term: string) {
    PermissionService.assertPermission(user, 'customers', 'read', user.branchId ?? undefined);
    return customerRepository.findMany({
      where: {
        OR: [
          { fullName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term } },
        ],
      },
      take: 10,
    });
  }

  async getTimeline(user: AuthUser, id: string) {
    PermissionService.assertPermission(user, 'customers', 'read', user.branchId ?? undefined);
    const prisma = DatabaseService.getClient();
    return prisma.customerTimeline.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async merge(user: AuthUser, primaryId: string, duplicateId: string) {
    PermissionService.assertPermission(user, 'customers', 'update', user.branchId ?? undefined);
    if (primaryId === duplicateId) {
      throw new AppError('Cannot merge the same customer', 400);
    }
    const prisma = DatabaseService.getClient();
    const [primary, duplicate] = await Promise.all([
      prisma.customer.findUnique({ where: { id: primaryId } }),
      prisma.customer.findUnique({ where: { id: duplicateId } }),
    ]);
    if (!primary || !duplicate) {
      throw new AppError('Customer not found', 404);
    }

    await prisma.$transaction([
      prisma.booking.updateMany({ where: { customerId: duplicateId }, data: { customerId: primaryId } }),
      prisma.customerNote.updateMany({ where: { customerId: duplicateId }, data: { customerId: primaryId } }),
      prisma.customerTimeline.updateMany({ where: { customerId: duplicateId }, data: { customerId: primaryId } }),
      prisma.waitlistEntry.updateMany({ where: { customerId: duplicateId }, data: { customerId: primaryId } }),
      prisma.customer.update({
        where: { id: duplicateId },
        data: {
          notes: 'Merged into another profile',
          isBlacklisted: true,
          blacklistReason: 'Merged duplicate',
        },
      }),
    ]);

    await CustomerModel.updateStats(primaryId);
    await LoyaltyService.adjustTier(primaryId);
    await CustomerModel.recordTimeline(
      primaryId,
      TimelineEventType.MERGED,
      'Customer profile merged',
      { duplicateId },
      user.id
    );
  }

  async loyaltyStatus(user: AuthUser, id: string) {
    PermissionService.assertPermission(user, 'customers', 'read', user.branchId ?? undefined);
    return LoyaltyService.getStatus(id);
  }

  async loyaltyHistory(user: AuthUser, id: string) {
    PermissionService.assertPermission(user, 'customers', 'read', user.branchId ?? undefined);
    return LoyaltyService.getHistory(id);
  }

  async adjustPoints(user: AuthUser, id: string, points: number, reason: string) {
    PermissionService.assertPermission(user, 'customers', 'update', user.branchId ?? undefined);
    await LoyaltyService.adjustPoints(id, points, reason);
    await CustomerModel.recordTimeline(
      id,
      TimelineEventType.LOYALTY_UPDATED,
      'Loyalty points adjusted',
      { points, reason },
      user.id
    );
  }

  async getRewards() {
    return LoyaltyService.getRewards();
  }

  async redeemReward(user: AuthUser, id: string, rewardId: string) {
    PermissionService.assertPermission(user, 'customers', 'update', user.branchId ?? undefined);
    await LoyaltyService.redeemReward(id, rewardId);
  }

  async referralStats(user: AuthUser, id: string) {
    PermissionService.assertPermission(user, 'customers', 'read', user.branchId ?? undefined);
    const prisma = DatabaseService.getClient();
    const referrals = await prisma.customer.findMany({
      where: { referredById: id },
      select: { id: true, fullName: true, createdAt: true },
    });
    const account = await prisma.loyaltyAccount.findUnique({ where: { customerId: id } });
    return {
      total: referrals.length,
      loyaltyReferrals: account?.totalReferrals ?? 0,
      referrals,
    };
  }

  async exportData(user: AuthUser, id: string) {
    PermissionService.assertPermission(user, 'customers', 'read', user.branchId ?? undefined);
    const prisma = DatabaseService.getClient();
    const [customer, bookings, notes, timeline] = await Promise.all([
      prisma.customer.findUnique({ where: { id } }),
      prisma.booking.findMany({ where: { customerId: id } }),
      prisma.customerNote.findMany({ where: { customerId: id } }),
      prisma.customerTimeline.findMany({ where: { customerId: id } }),
    ]);
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }
    return {
      customer,
      bookings,
      notes,
      timeline,
    };
  }
}
