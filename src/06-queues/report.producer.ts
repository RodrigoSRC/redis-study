import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class ReportProducer implements OnModuleDestroy {
  readonly queue: Queue;

  constructor() {
    this.queue = new Queue('report', {
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379'),
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: false,
        removeOnFail: false,
      },
    });
  }

  async addReportJob(data: {
    userId: number;
    filters: Record<string, unknown>;
  }): Promise<string | undefined> {
    const job = await this.queue.add('generateReport', data);
    return job.id;
  }

  onModuleDestroy() {
    void this.queue.close();
  }
}
