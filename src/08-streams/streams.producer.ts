import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';

export const AUDIT_STREAM = 'audit:stream';

@Injectable()
export class StreamsProducer {
  constructor(private readonly redis: RedisService) {}

  /**
   * Adiciona um evento de auditoria na stream.
   * Retorna o ID gerado pelo Redis (ex: "1712000000000-0").
   */
  async addEvent(
    action: string,
    payload: Record<string, unknown>,
  ): Promise<string> {
    return this.redis.xadd(AUDIT_STREAM, {
      action,
      payload: JSON.stringify(payload),
      timestamp: new Date().toISOString(),
    });
  }
}
