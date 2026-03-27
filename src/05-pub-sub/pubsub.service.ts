import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class PubSubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PubSubService.name);
  private readonly subscriber: Redis; //conexão dedicada para receber mensagens

  constructor() {
    this.subscriber = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379'),
    });
  }

  async onModuleInit() {
    await this.subscriber.subscribe('user.created', 'order.placed');

    this.subscriber.on('message', (channel: string, message: string) => {
      const payload = JSON.parse(message) as Record<string, unknown>;
      this.logger.log(`[${channel}] recebido: ${JSON.stringify(payload)}`);

      if (channel === 'user.created') {
        this.handleUserCreated(payload as { id: number; email: string });
      }
    });
  }

  private handleUserCreated(payload: { id: number; email: string }) {
    // simula envio de email, webhook, etc.
    this.logger.log(`Enviando email de boas-vindas para ${payload.email}`);
  }

  onModuleDestroy() {
    this.subscriber.disconnect();
  }
}
