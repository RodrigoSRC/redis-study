import { ReportProducer } from './report.producer';
import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';

@Controller('queues')
export class QueueController {
  constructor(private readonly producer: ReportProducer) {}

  @Post('report')
  @HttpCode(202) //202 = "recebi", mas ainda não processei
  async requestReport(
    @Body() body: { userId: number; filters: Record<string, unknown> },
  ) {
    const jobId = await this.producer.addReportJob(body);
    return { accepted: true, jobId };
  }

  @Get('report/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    const job = await this.producer.queue.getJob(jobId);
    if (!job) return { found: false };

    const state = await job.getState();
    // Estados: waiting | active | completed | failed | delayed

    return {
      found: true,
      jobId: job.id,
      state,
      attemptsMade: job.attemptsMade,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
    };
  }
}
