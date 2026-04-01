import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
    });
  }

  async set(key: string, value: string): Promise<void> {
    await this.client.set(key, value);
  }

  async setWithTTL(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.client.set(key, value, 'EX', ttlSeconds);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<number> {
    return this.client.expire(key, ttlSeconds);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async publish(channel: string, message: string): Promise<number> {
    return this.client.publish(channel, message);
    // retorna o número de subscribers que receberam
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
