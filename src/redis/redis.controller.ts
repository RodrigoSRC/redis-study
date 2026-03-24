import { Controller, Get, Post } from '@nestjs/common';
import { RedisService } from './redis.service';

@Controller('redis')
export class RedisController {
  constructor(private readonly redis: RedisService) {}

  @Post('test')
  async write() {
    await this.redis.setWithTTL(
      'test:key',
      JSON.stringify({ msg: 'Hello Redis!' }),
      60,
    );
    return { written: true };
  }

  @Get('test')
  async read(): Promise<{ msg: string }> {
    const raw = await this.redis.get('test:key');
    return raw ? (JSON.parse(raw) as { msg: string }) : { msg: 'cache miss' };
  }
}
