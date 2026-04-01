import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { RateLimitingController } from './rate-limiting.controller';
import { RateLimitGuard } from './rate-limit.guard';

@Module({
  imports: [RedisModule],
  controllers: [RateLimitingController],
  providers: [RateLimitGuard],
})
export class RateLimitingModule {}
