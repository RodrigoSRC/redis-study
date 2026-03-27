import { Body, Controller, Post } from '@nestjs/common';
import { PubService } from './pubsub.publisher';

@Controller('pub-sub')
export class PubSubController {
  constructor(private readonly pubService: PubService) {}

  @Post('publish')
  async publish(@Body() req: { channel: string; payload: object }) {
    await this.pubService.publish(req.channel, req.payload);
    return { ok: true, channel: req.channel };
  }
}
