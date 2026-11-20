import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiAssistantService } from './ai-assistant.service';
import { AiChatDto } from './dto/ai-chat.dto';

@ApiTags('AI Art Assistant')
@Controller('ai')
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post('chat')
  @ApiOperation({
    summary:
      'Chat with Gemini AI Art Consultant with Function Calling (pricing math & portfolio tools)',
  })
  async chat(@Body() dto: AiChatDto, @Req() req: any) {
    const clientIp =
      req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      req.ip ||
      'unknown-client';

    const normalizedIp = Array.isArray(clientIp) ? clientIp[0] : clientIp.split(',')[0];
    return this.aiAssistantService.chat(dto, normalizedIp.trim());
  }
}
