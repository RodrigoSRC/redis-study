import { Module } from '@nestjs/common';
import { RedisModule } from 'src/redis/redis.module';
import { StreamsController } from './streams.controller';
import { StreamsConsumer } from './streams.consumer';
import { StreamsProducer } from './streams.producer';

@Module({
  imports: [RedisModule],
  controllers: [StreamsController],
  providers: [StreamsProducer, StreamsConsumer],
})
export class StreamsModule {}
