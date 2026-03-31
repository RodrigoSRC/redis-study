import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker, Job } from 'bullmq';

type ReportJobData = { userId: number; fitlers: Record<string, unknown> };

@Injectable()
export class ReportProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportProcessor.name);
  private worker: Worker<ReportJobData>;

  onModuleInit() {
    this.worker = new Worker<ReportJobData>(
      'report',
      async (job: Job<ReportJobData>) => {
        await this.process(job);
      },
      {
        connection: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: parseInt(process.env.REDIS_PORT ?? '6379'),
        },
        concurrency: 2,
      },
    );

    this.worker.on('active', (job) => {
      this.logger.log(`Job ${job.id} iniciado`);
    });
    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} concluído`);
    });
    this.worker.on('failed', (job, err) => {
      this.logger.log(
        `Job ${job?.id} falhou (tentativa ${job?.attemptsMade}): ${err.message}`,
      );
    });
  }

  private async process(job: Job<ReportJobData>) {
    this.logger.log(`Gerando relatório para userId=${job.data.userId}`);

    await new Promise<void>((resolve) => setTimeout(resolve, 5000));

    this.logger.log(`Relatório para userId=${job.data.userId} pronto`);
  }

  onModuleDestroy() {
    void this.worker.close();
  }
}
