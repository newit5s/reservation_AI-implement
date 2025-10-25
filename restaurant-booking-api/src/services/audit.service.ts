import { DatabaseService } from './database.service';

interface LoginAuditPayload {
  userId?: string;
  email: string;
  success: boolean;
  message?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditService {
  static async recordLoginAttempt(payload: LoginAuditPayload): Promise<void> {
    const prisma = DatabaseService.getClient();
    await prisma.loginAudit.create({
      data: {
        email: payload.email.toLowerCase(),
        success: payload.success,
        message: payload.message,
        ipAddress: payload.ipAddress ?? null,
        userAgent: payload.userAgent ?? null,
        userId: payload.userId ?? null,
      },
    });
  }
}
