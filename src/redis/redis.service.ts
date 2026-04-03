import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

export interface StreamMessage {
  id: string;
  data: Record<string, string>;
}

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

  // ── Streams ──────────────────────────────────────────────────────────────

  async xadd(
    streamKey: string,
    fields: Record<string, string>,
  ): Promise<string> {
    const args: string[] = [];
    for (const [k, v] of Object.entries(fields)) args.push(k, v);
    // '*' faz o Redis gerar o ID automaticamente (timestamp-sequence)
    return this.client.xadd(streamKey, '*', ...args) as Promise<string>;
  }

  async xrange(
    streamKey: string,
    start = '-',
    end = '+',
  ): Promise<StreamMessage[]> {
    const raw = await this.client.xrange(streamKey, start, end);
    return this.parseStreamMessages(raw as [string, string[]][]);
  }

  async xgroupCreate(streamKey: string, groupName: string): Promise<void> {
    try {
      // '$' = só mensagens novas a partir de agora; MKSTREAM cria a stream se não existir
      await (this.client as any).xgroup(
        'CREATE',
        streamKey,
        groupName,
        '$',
        'MKSTREAM',
      );
    } catch (err: unknown) {
      // BUSYGROUP = grupo já existe — ignorar
      if (err instanceof Error && err.message.includes('BUSYGROUP')) return;
      throw err;
    }
  }

  async xreadgroup(
    streamKey: string,
    groupName: string,
    consumerName: string,
    count = 10,
  ): Promise<StreamMessage[]> {
    // '>' = entrega apenas mensagens ainda não entregues a nenhum consumer do grupo
    const raw = (await (this.client as any).xreadgroup(
      'GROUP',
      groupName,
      consumerName,
      'COUNT',
      count,
      'STREAMS',
      streamKey,
      '>',
    )) as [[string, [string, string[]][]], ...unknown[]] | null;

    if (!raw) return [];
    const [, messages] = raw[0];
    return this.parseStreamMessages(messages);
  }

  async xack(streamKey: string, groupName: string, id: string): Promise<void> {
    await this.client.xack(streamKey, groupName, id);
  }

  xpending(
    streamKey: string,
    groupName: string,
    start = '-',
    end = '+',
    count = 10,
  ): Promise<unknown> {
    return (this.client as any).xpending(
      streamKey,
      groupName,
      start,
      end,
      count,
    );
  }

  private parseStreamMessages(raw: [string, string[]][]): StreamMessage[] {
    return (raw ?? []).map(([id, fields]) => {
      const data: Record<string, string> = {};
      for (let i = 0; i < fields.length; i += 2)
        data[fields[i]] = fields[i + 1];
      return { id, data };
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
