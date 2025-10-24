import { logger } from '../utils/logger';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  static async sendEmail(payload: EmailPayload): Promise<void> {
    logger.info('Sending email', payload);
  }
}
