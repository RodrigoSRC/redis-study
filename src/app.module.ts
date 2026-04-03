import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';
import { PostsModule } from './03-caching/posts.module';
import { PrismaModule } from './prisma/prisma.module';
import { SessionsModule } from './04-sessions/sessions.module';
import { PubSubModule } from './05-pub-sub/pubsub.module';
import { QueuesModule } from './06-queues/queues.module';
import { RateLimitingModule } from './07-rate-limiting/rate-limiting.module';
import { StreamsModule } from './08-streams/streams.module';
@Module({
  imports: [
    RedisModule,
    PrismaModule,
    PostsModule,
    SessionsModule,
    PubSubModule,
    QueuesModule,
    RateLimitingModule,
    StreamsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
