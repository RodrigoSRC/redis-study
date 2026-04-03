import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { AUDIT_STREAM } from './streams.producer';

const GROUP = 'audit-group';
const CONSUMER = 'worker-1';
const POLL_INTERVAL_MS = 1000;

/**
 * Consumer que processa eventos da stream usando Consumer Groups.
 *
 * Consumer Groups garantem que:
 *  - cada mensagem é entregue a apenas UM consumer do grupo
 *  - se o worker cair antes do XACK, a mensagem fica "pending" e pode ser
 *    reclamada depois (XAUTOCLAIM / XCLAIM)
 */
@Injectable()
export class StreamsConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StreamsConsumer.name);
  private interval!: ReturnType<typeof setInterval>;

  constructor(private readonly redis: RedisService) {}

  async onModuleInit() {
    // Cria o grupo se ainda não existir (ignora BUSYGROUP)
    await this.redis.xgroupCreate(AUDIT_STREAM, GROUP);
    this.logger.log(
      `Consumer group "${GROUP}" pronto na stream "${AUDIT_STREAM}"`,
    );

    // Polling a cada 1 segundo por novas mensagens
    this.interval = setInterval(() => void this.poll(), POLL_INTERVAL_MS);
  }

  private async poll(): Promise<void> {
    const messages = await this.redis.xreadgroup(AUDIT_STREAM, GROUP, CONSUMER);

    for (const { id, data } of messages) {
      this.logger.log(
        `[Audit] id=${id} | action=${data.action} | ts=${data.timestamp} | payload=${data.payload}`,
      );

      // Processa o evento de acordo com a ação
      this.handleEvent(data.action, data.payload);

      // XACK: confirma que a mensagem foi processada com sucesso.
      // Sem isso, ela ficaria em estado "pending" indefinidamente.
      await this.redis.xack(AUDIT_STREAM, GROUP, id);
    }
  }

  private handleEvent(action: string, rawPayload: string): void {
    const payload = JSON.parse(rawPayload) as Record<string, unknown>;

    switch (action) {
      case 'user.login':
        this.logger.log(
          `Registrando login do usuário ${String(payload.userId)}`,
        );
        break;
      case 'post.created':
        this.logger.log(`Indexando post ${String(payload.postId)} na busca`);
        break;
      default:
        this.logger.warn(`Ação desconhecida: ${action}`);
    }
  }

  onModuleDestroy() {
    clearInterval(this.interval);
  }
}
