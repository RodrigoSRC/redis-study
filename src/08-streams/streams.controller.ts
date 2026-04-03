import { Body, Controller, Get, Post } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { StreamsProducer, AUDIT_STREAM } from './streams.producer';

const GROUP = 'audit-group';

@Controller('streams')
export class StreamsController {
  constructor(
    private readonly producer: StreamsProducer,
    private readonly redis: RedisService,
  ) {}

  /**
   * POST /streams/event
   * Publica um novo evento de auditoria na stream.
   * Ex.: { "action": "user.login", "payload": { "userId": 42 } }
   */
  @Post('event')
  async publishEvent(
    @Body() body: { action: string; payload: Record<string, unknown> },
  ) {
    const id = await this.producer.addEvent(body.action, body.payload);
    return { ok: true, streamId: id };
  }

  /**
   * GET /streams/history
   * Lê todo o histórico da stream (XRANGE - +).
   * Diferença do Pub/Sub: as mensagens ficam armazenadas permanentemente.
   */
  @Get('history')
  async getHistory() {
    const messages = await this.redis.xrange(AUDIT_STREAM);
    return { count: messages.length, messages };
  }

  /**
   * GET /streams/pending
   * Lista mensagens entregues ao consumer group mas ainda não confirmadas (XACK).
   * Útil para identificar mensagens que falharam no processamento.
   */
  @Get('pending')
  async getPending() {
    const pending = await this.redis.xpending(AUDIT_STREAM, GROUP);
    return { pending };
  }
}
