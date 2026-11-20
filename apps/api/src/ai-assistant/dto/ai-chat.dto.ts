import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @ApiProperty({ enum: ['user', 'model', 'assistant'], description: 'Sender role' })
  @IsString()
  @IsNotEmpty()
  role!: 'user' | 'model' | 'assistant';

  @ApiProperty({ description: 'Message content text' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class AiChatDto {
  @ApiProperty({ type: [ChatMessageDto], description: 'Conversation history' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[];
}

export interface ActionSuggestion {
  type: 'COMMISSION' | 'PORTFOLIO' | 'CONTACT';
  title: string;
  url: string;
  subtitle?: string;
  details?: {
    totalAmount?: number;
    depositAmount?: number;
    requireDeposit?: boolean;
    artworkBasePrice?: number;
    artworkSlug?: string;
    artworkTitle?: string;
    imageUrl?: string;
    dimensions?: string;
  };
}
