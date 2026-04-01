import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RedisService } from '../redis/redis.service';
import { RATE_LIMIT_KEY, RateLimitOptions } from './rate-limit.decorator';

const DEFAULT_LIMIT = 10;
const DEFAULT_TTL = 60;

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly redis: RedisService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Lê o "post-it" da rota atual (pode ser undefined se não tiver @RateLimit)
    const options = this.reflector.get<RateLimitOptions | undefined>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    const limit = options?.limit ?? DEFAULT_LIMIT;
    const ttl = options?.ttl ?? DEFAULT_TTL;

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    // 2. Chave Redis única por IP + rota
    //    Exemplo: "rate:127.0.0.1:/rate-limiting/login"
    const ip = req.ip ?? 'unknown';
    const key = `rate:${ip}:${req.path}`;

    // 3. INCR — comando Redis atômico
    //    Se a chave não existe: cria com valor 1
    //    Se existe: incrementa e retorna o novo valor
    const count = await this.redis.incr(key);

    // 4. Só seta o EXPIRE na primeira request (count === 1)
    //    Isso define a janela. Nas próximas, o TTL já está correndo.
    if (count === 1) {
      await this.redis.expire(key, ttl);
    }

    // 5. Headers informativos — padrão de mercado (GitHub API, etc.)
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count));

    // 6. Se ultrapassou: 429
    if (count > limit) {
      const retryAfter = await this.redis.ttl(key);
      res.setHeader('Retry-After', retryAfter);

      throw new HttpException(
        {
          statusCode: 429,
          error: 'Too Many Requests',
          message: `Limite de ${limit} req/${ttl}s atingido. Tente em ${retryAfter}s.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
