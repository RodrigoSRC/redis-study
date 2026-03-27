import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
