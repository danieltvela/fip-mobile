import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IsIn, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { Roles, RolesGuard } from '../common/roles.guard';
import type { PublishNotificationDto } from '@fip/shared';

export const TYPOLOGIES = ['BREAKING_NEWS', 'EVENT_REMINDER', 'NEW_MATERIAL', 'GENERAL'] as const;
export const SEGMENTS = ['ALL', 'JOURNALISTS', 'CONFIRMED_AGENDA'] as const;

export class PublishNotificationBody implements PublishNotificationDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  body!: string;

  @IsIn(TYPOLOGIES)
  typology!: (typeof TYPOLOGIES)[number];

  @IsIn(SEGMENTS)
  segment!: (typeof SEGMENTS)[number];

  @IsOptional()
  @ValidateIf((o) => o.segment === 'JOURNALISTS')
  @IsString()
  userId?: string;
}

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('PRESS_TEAM')
@Controller('notifications')
export class NotificationsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.notification.findMany({ orderBy: { createdAt: 'desc' } });
  }

  /**
   * Publishes a notification for a typology targeted at a segment. When the
   * segment is JOURNALISTS, an optional userId narrows delivery to one user;
   * otherwise a Notification row is recorded per recipient according to the
   * segment (expanded by the mobile app polling endpoint).
   */
  @Post()
  publish(@Body() body: PublishNotificationBody) {
    return this.prisma.notification.create({
      data: {
        title: body.title,
        body: body.body,
        typology: body.typology,
        segment: body.segment,
        userId: body.userId ?? null,
      },
    });
  }
}
