import { Module } from '@nestjs/common';
import { QueueController } from './queues.controller';
import { ReportProducer } from './report.producer';
import { ReportProcessor } from './report.processor';

@Module({
  controllers: [QueueController],
  providers: [ReportProducer, ReportProcessor],
})
export class QueuesModule {}
