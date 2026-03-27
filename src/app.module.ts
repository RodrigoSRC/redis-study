import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';
import { PostsModule } from './03-caching/posts.module';
import { PrismaModule } from './prisma/prisma.module';
import { SessionsModule } from './04-sessions/sessions.module';
import { PubSubModule } from './05-pub-sub/pubsub.module';

@Module({
  imports: [
    RedisModule,
    PrismaModule,
    PostsModule,
    SessionsModule,
    PubSubModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
