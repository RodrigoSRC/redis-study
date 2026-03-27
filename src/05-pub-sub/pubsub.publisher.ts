import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class PubService {
  constructor(private readonly redis: RedisService) {}

  async publish(channel: string, payload: object): Promise<void> {
    await this.redis.publish(channel, JSON.stringify(payload));
  }
}
