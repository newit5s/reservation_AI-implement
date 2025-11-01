import { logger } from '../utils/logger';

type JobHandler = () => Promise<void> | void;

interface ScheduledJob {
  id: string;
  runAt: Date;
  handler: JobHandler;
  timeout: NodeJS.Timeout;
}

export class JobScheduler {
  private static instance: JobScheduler;

  private jobs = new Map<string, ScheduledJob>();

  static getInstance(): JobScheduler {
    if (!JobScheduler.instance) {
      JobScheduler.instance = new JobScheduler();
    }
    return JobScheduler.instance;
  }

  schedule(id: string, runAt: Date, handler: JobHandler): void {
    const delay = runAt.getTime() - Date.now();
    if (delay <= 0) {
      logger.warn('Attempted to schedule a job in the past, executing immediately', { id, runAt });
      Promise.resolve()
        .then(() => handler())
        .catch((error) => logger.error('Scheduled job failed', { id, error }));
      return;
    }

    this.cancel(id);

    const timeout = setTimeout(async () => {
      try {
        await handler();
      } catch (error) {
        logger.error('Scheduled job execution failed', { id, error });
      } finally {
        this.jobs.delete(id);
      }
    }, delay);

    this.jobs.set(id, { id, runAt, handler, timeout });
    logger.info('Scheduled job', { id, runAt });
  }

  cancel(id: string): void {
    const existing = this.jobs.get(id);
    if (existing) {
      clearTimeout(existing.timeout);
      this.jobs.delete(id);
      logger.info('Cancelled scheduled job', { id });
    }
  }

  flush(): void {
    this.jobs.forEach((job) => clearTimeout(job.timeout));
    this.jobs.clear();
  }
}
