import { SetMetadata } from '@nestjs/common';

export interface RateLimitOptions {
  limit: number; // número máximo de requisições
  ttl: number; // janela em segundos
}

export const RATE_LIMIT_KEY = 'rate_limit';

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);
