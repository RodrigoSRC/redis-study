import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';

export class CreateSessionDto {
  userId: number;
  email: string;
  role: string;
}

export interface SessionData {
  userId: number;
  email: string;
  role: string;
}

const SESSION_TTL = 86400;

@Injectable()
export class SessionsService {
  constructor(private readonly redis: RedisService) {}

  async createSession(dto: CreateSessionDto): Promise<string> {
    const sessionId = crypto.randomUUID();
    const key = `session:${sessionId}`;
    const data: SessionData = {
      userId: dto.userId,
      email: dto.email,
      role: dto.role,
    };
    await this.redis.setWithTTL(key, JSON.stringify(data), SESSION_TTL);
    return sessionId;
  }

  async getSession(sessionId: string): Promise<SessionData> {
    const key = `session:${sessionId}`;
    const raw = await this.redis.get(key);
    if (!raw) {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }
    return JSON.parse(raw) as SessionData;
  }

  async destroySession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.redis.del(key);
  }
}
