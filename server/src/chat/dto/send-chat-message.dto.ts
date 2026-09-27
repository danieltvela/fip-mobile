import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SendChatMessageDto {
  /** Required only when the press team sends the message (target conversation). */
  @IsOptional()
  @IsString()
  journalistId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;
}
