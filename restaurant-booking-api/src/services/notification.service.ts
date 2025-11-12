import { randomUUID } from 'crypto';
import { Notification, NotificationRecipient, NotificationStatus, NotificationType } from '@prisma/client';
import { DatabaseService } from './database.service';
import { EmailService } from './email.service';
import { logger } from '../utils/logger';
import { RedisService } from './redis.service';
import { realtimeService } from './realtime.service';

export interface SendNotificationPayload {
  branchId?: string;
  recipientType: NotificationRecipient;
  recipientId?: string;
  subject?: string;
  content: string;
  channels: NotificationType[];
  metadata?: Record<string, unknown>;
  locale?: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
  locale: string;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: true,
  sms: false,
  push: false,
  inApp: true,
  locale: 'en',
};

type PrismaNotificationDelegate = {
  create: (args: { data: Record<string, unknown> }) => Promise<Notification>;
  update: (args: { where: { id: string }; data: Partial<Notification> }) => Promise<Notification>;
  findMany: (args: { where: Record<string, unknown>; orderBy: Record<string, unknown>; take: number }) => Promise<Notification[]>;
};

export class NotificationService {
  private client = DatabaseService.getClient();
  private redis = RedisService.getClient();
  private processing = false;
  private queue: SendNotificationPayload[] = [];

  private get notificationDelegate(): PrismaNotificationDelegate | null {
    const delegate = (this.client as unknown as { notification?: unknown })?.notification as
      | Partial<PrismaNotificationDelegate>
      | undefined;

    if (
      !delegate ||
      typeof delegate.create !== 'function' ||
      typeof delegate.update !== 'function' ||
      typeof delegate.findMany !== 'function'
    ) {
      return null;
    }

    return delegate as PrismaNotificationDelegate;
  }

  private createShadowRecord(
    channel: NotificationType,
    payload: SendNotificationPayload,
    status: NotificationStatus,
    id: string = randomUUID(),
    errorMessage: string | null = null
  ): Notification {
    return {
      id,
      recipientType: payload.recipientType,
      recipientId: payload.recipientId ?? null,
      type: channel,
      subject: payload.subject ?? null,
      content: payload.content,
      status,
      sentAt: status === NotificationStatus.SENT || status === NotificationStatus.READ ? new Date() : null,
      readAt: status === NotificationStatus.READ ? new Date() : null,
      errorMessage,
      createdAt: new Date(),
    };
  }

  async enqueue(payload: SendNotificationPayload): Promise<void> {
    this.queue.push(payload);
    void this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }
    this.processing = true;

    while (this.queue.length) {
      const job = this.queue.shift();
      if (!job) {
        break;
      }
      try {
        await this.dispatch(job);
      } catch (error) {
        logger.error('Failed to send notification job', { error, job });
      }
    }

    this.processing = false;
  }

  private async resolveRecipient(
    recipientType: NotificationRecipient,
    recipientId?: string
  ): Promise<{ email?: string; phone?: string }> {
    if (!recipientId) {
      return {};
    }

    if (recipientType === NotificationRecipient.CUSTOMER) {
      const delegate = (this.client as unknown as { customer?: { findUnique?: unknown } }).customer;
      if (!delegate || typeof delegate.findUnique !== 'function') {
        logger.warn('Customer delegate missing when resolving notification recipient', { recipientId });
        return {};
      }
      const customer = await delegate.findUnique({
        where: { id: recipientId },
        select: { email: true, phone: true },
      });
      return { email: customer?.email ?? undefined, phone: customer?.phone ?? undefined };
    }

    const userDelegate = (this.client as unknown as { user?: { findUnique?: unknown } }).user;
    if (!userDelegate || typeof userDelegate.findUnique !== 'function') {
      logger.warn('User delegate missing when resolving notification recipient', { recipientId });
      return {};
    }
    const user = await userDelegate.findUnique({
      where: { id: recipientId },
      select: { email: true, phone: true },
    });
    return { email: user?.email ?? undefined, phone: user?.phone ?? undefined };
  }

  private async dispatch(payload: SendNotificationPayload): Promise<void> {
    for (const channel of payload.channels) {
      const delegate = this.notificationDelegate;
      if (!delegate) {
        logger.warn('Notification delegate unavailable, dispatching without persistence', {
          channel,
          recipientType: payload.recipientType,
          recipientId: payload.recipientId,
        });

        const shadow = this.createShadowRecord(channel, payload, NotificationStatus.PENDING);

        try {
          await this.deliver(channel, payload, shadow.id);
          const delivered = { ...shadow, status: NotificationStatus.SENT, sentAt: new Date(), errorMessage: null };
          realtimeService.emitNotification(payload.branchId ?? null, payload.recipientType, payload.recipientId ?? null, delivered);
        } catch (error) {
          const failed = {
            ...shadow,
            status: NotificationStatus.FAILED,
            errorMessage: (error as Error).message,
          };
          logger.error('Notification delivery failed without persistence', { error, payload });
          realtimeService.emitNotification(payload.branchId ?? null, payload.recipientType, payload.recipientId ?? null, failed);
        }
        continue;
      }

      const notification = await delegate.create({
        data: {
          recipientType: payload.recipientType,
          recipientId: payload.recipientId ?? null,
          type: channel,
          subject: payload.subject ?? null,
          content: payload.content,
        },
      });

      if (!notification?.id) {
        logger.warn('Notification delegate returned no record, using shadow notification', {
          channel,
          recipientType: payload.recipientType,
        });

        const shadow = this.createShadowRecord(channel, payload, NotificationStatus.PENDING);

        try {
          await this.deliver(channel, payload, shadow.id);
          const delivered = { ...shadow, status: NotificationStatus.SENT, sentAt: new Date(), errorMessage: null };
          realtimeService.emitNotification(payload.branchId ?? null, payload.recipientType, payload.recipientId ?? null, delivered);
        } catch (error) {
          const failed = {
            ...shadow,
            status: NotificationStatus.FAILED,
            errorMessage: (error as Error).message,
          };
          logger.error('Notification delivery failed without persisted record', { error, payload });
          realtimeService.emitNotification(payload.branchId ?? null, payload.recipientType, payload.recipientId ?? null, failed);
        }
        continue;
      }

      try {
        await this.deliver(channel, payload, notification.id);
        const delivered = await delegate.update({
          where: { id: notification.id },
          data: { status: NotificationStatus.SENT, sentAt: new Date() },
        });
        realtimeService.emitNotification(
          payload.branchId ?? null,
          payload.recipientType,
          payload.recipientId ?? null,
          delivered
        );
      } catch (error) {
        const failed = await delegate.update({
          where: { id: notification.id },
          data: { status: NotificationStatus.FAILED, errorMessage: (error as Error).message },
        });
        logger.error('Notification delivery failed', { id: notification.id, error });
        realtimeService.emitNotification(
          payload.branchId ?? null,
          payload.recipientType,
          payload.recipientId ?? null,
          failed
        );
      }
    }
  }

  private async deliver(channel: NotificationType, payload: SendNotificationPayload, id: string): Promise<void> {
    const recipient = await this.resolveRecipient(payload.recipientType, payload.recipientId);

    switch (channel) {
      case NotificationType.EMAIL: {
        if (!recipient.email) {
          throw new Error('Missing email for notification recipient');
        }
        await EmailService.sendEmail({
          to: recipient.email,
          subject: payload.subject ?? 'Reservation Update',
          html: payload.content,
        });
        break;
      }
      case NotificationType.SMS: {
        if (!recipient.phone) {
          throw new Error('Missing phone number for SMS notification');
        }
        logger.info('Simulating SMS delivery', { id, to: recipient.phone, content: payload.content });
        break;
      }
      case NotificationType.PUSH: {
        logger.info('Simulating push notification', { id, recipient: payload.recipientId, content: payload.content });
        break;
      }
      case NotificationType.IN_APP: {
        // In-app notifications are considered delivered immediately.
        break;
      }
      default:
        logger.warn('Unknown notification channel', { channel });
    }
  }

  async list(recipientType: NotificationRecipient, recipientId?: string, limit = 50): Promise<Notification[]> {
    const delegate = this.notificationDelegate;
    if (!delegate) {
      logger.warn('Notification delegate missing when listing notifications');
      return [];
    }

    return delegate.findMany({
      where: {
        recipientType,
        recipientId: recipientId ?? null,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    const delegate = this.notificationDelegate;
    if (!delegate) {
      logger.warn('Notification delegate missing when marking as read', { id });
      return this.createShadowRecord(
        NotificationType.IN_APP,
        { recipientType: NotificationRecipient.USER, content: '', channels: [NotificationType.IN_APP] },
        NotificationStatus.READ,
        id
      );
    }

    return delegate.update({
      where: { id },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
  }

  private preferenceKey(recipientType: NotificationRecipient, recipientId?: string): string {
    return `notifications:prefs:${recipientType}:${recipientId ?? 'global'}`;
  }

  async getPreferences(
    recipientType: NotificationRecipient,
    recipientId?: string
  ): Promise<NotificationPreferences> {
    const key = this.preferenceKey(recipientType, recipientId);
    const cached = await this.redis.get(key);
    if (cached) {
      try {
        return { ...DEFAULT_PREFERENCES, ...(JSON.parse(cached) as NotificationPreferences) };
      } catch (error) {
        logger.warn('Failed to parse notification preferences', { error });
      }
    }
    return DEFAULT_PREFERENCES;
  }

  async updatePreferences(
    recipientType: NotificationRecipient,
    recipientId: string | undefined,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const merged = { ...(await this.getPreferences(recipientType, recipientId)), ...preferences };
    const key = this.preferenceKey(recipientType, recipientId);
    await this.redis.set(key, JSON.stringify(merged));
    return merged;
  }
}

export const notificationService = new NotificationService();
