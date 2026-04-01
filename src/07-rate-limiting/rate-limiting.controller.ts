import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimit } from './rate-limit.decorator';

@Controller('rate-limiting')
@UseGuards(RateLimitGuard) // aplica o guard em TODAS as rotas do controller
export class RateLimitingController {
  // Limite padrão: 10 req/60s (vem do DEFAULT_LIMIT no guard)
  @Get('default')
  default() {
    return { message: 'Dentro do limite!' };
  }

  // Sobrescreve: só 3 requests por minuto (simula endpoint de login)
  @RateLimit({ limit: 3, ttl: 60 })
  @Post('login')
  login() {
    return { message: 'Login simulado' };
  }
}
