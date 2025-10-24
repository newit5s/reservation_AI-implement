import { UserRole } from '@prisma/client';
import { AppError } from '../utils/app-error';
import { AuthUser } from '../types/auth';

type Resource =
  | 'branches'
  | 'bookings'
  | 'customers'
  | 'tables'
  | 'analytics'
  | 'settings'
  | 'blockedSlots';

type PermissionMatrix = Record<UserRole, Partial<Record<Resource, string[]>>>;

const permissionMatrix: PermissionMatrix = {
  [UserRole.MASTER_ADMIN]: {
    branches: ['*'],
    bookings: ['*'],
    customers: ['*'],
    tables: ['*'],
    analytics: ['*'],
    settings: ['*'],
    blockedSlots: ['*'],
  },
  [UserRole.BRANCH_ADMIN]: {
    branches: ['read', 'update', 'settings', 'operatingHours', 'blockedSlots'],
    bookings: ['create', 'read', 'update', 'report'],
    customers: ['create', 'read', 'update', 'blacklist'],
    tables: ['read', 'create', 'update', 'delete', 'status', 'layout', 'availability', 'combine'],
    analytics: ['view_branch'],
    settings: ['manage'],
    blockedSlots: ['manage'],
  },
  [UserRole.STAFF]: {
    branches: ['read'],
    bookings: ['create', 'read', 'update'],
    customers: ['create', 'read', 'update'],
    tables: ['read', 'status', 'availability'],
    analytics: ['view_own'],
    settings: [],
    blockedSlots: [],
  },
};

export class PermissionService {
  static hasPermission(
    user: AuthUser,
    resource: Resource,
    action: string,
    branchId?: string | null
  ): boolean {
    const permissions = permissionMatrix[user.role]?.[resource] ?? [];

    if (permissions.includes('*')) {
      return true;
    }

    if (!permissions.includes(action)) {
      return false;
    }

    if (user.role === UserRole.MASTER_ADMIN) {
      return true;
    }

    if (!branchId) {
      return true;
    }

    if (!user.branchId) {
      return false;
    }

    return user.branchId === branchId;
  }

  static assertPermission(
    user: AuthUser,
    resource: Resource,
    action: string,
    branchId?: string | null
  ): void {
    if (!PermissionService.hasPermission(user, resource, action, branchId)) {
      throw new AppError('You do not have permission to perform this action', 403);
    }
  }

  static getAccessibleBranches(user: AuthUser): string[] | null {
    if (user.role === UserRole.MASTER_ADMIN) {
      return null;
    }
    return user.branchId ? [user.branchId] : [];
  }

  static getPermissions(role: UserRole): Partial<Record<Resource, string[]>> {
    return permissionMatrix[role] ?? {};
  }

  static updateRolePermissions(role: UserRole, resource: Resource, actions: string[]): void {
    permissionMatrix[role] = permissionMatrix[role] ?? {};
    permissionMatrix[role]![resource] = actions;
  }
}

export type { Resource };
