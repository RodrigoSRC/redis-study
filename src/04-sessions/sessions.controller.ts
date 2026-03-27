import { Body, Controller, Get, Headers, HttpCode, Post } from '@nestjs/common';
import { SessionsService, CreateSessionDto } from './sessions.service';

@Controller('auth')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('login')
  async login(@Body() dto: CreateSessionDto) {
    const sessionId = await this.sessionsService.createSession(dto);
    return { sessionId };
  }

  @Get('me')
  me(@Headers('x-session-id') sessionId: string) {
    return this.sessionsService.getSession(sessionId);
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Headers('x-session-id') sessionId: string) {
    return this.sessionsService.destroySession(sessionId);
  }
}
