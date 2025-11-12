import { EventEmitter } from 'events';
import { Notification, NotificationRecipient } from '@prisma/client';

export interface NotificationEventPayload {
  branchId: string | null;
  recipientType: NotificationRecipient;
  recipientId: string | null;
  notification: Notification;
}

export type NotificationListener = (payload: NotificationEventPayload) => void;

export class RealtimeService {
  private emitter = new EventEmitter();
  private readonly notificationEvent = 'notification';

  emitNotification(
    branchId: string | null,
    recipientType: NotificationRecipient,
    recipientId: string | null,
    notification: Notification
  ): void {
    const payload: NotificationEventPayload = {
      branchId,
      recipientType,
      recipientId,
      notification,
    };
    this.emitter.emit(this.notificationEvent, payload);
  }

  onNotification(listener: NotificationListener): () => void {
    this.emitter.on(this.notificationEvent, listener);
    return () => this.emitter.off(this.notificationEvent, listener);
  }

  onceNotification(listener: NotificationListener): void {
    this.emitter.once(this.notificationEvent, listener);
  }

  removeNotificationListener(listener: NotificationListener): void {
    this.emitter.off(this.notificationEvent, listener);
  }
}

export const realtimeService = new RealtimeService();
