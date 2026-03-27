import { Module } from '@nestjs/common';
import { PubSubController } from './pubsub.controller';
import { PubSubService } from './pubsub.service';
import { PubService } from './pubsub.publisher';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [PubSubController],
  providers: [PubSubService, PubService],
})
export class PubSubModule {}
