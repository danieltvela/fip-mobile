import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { NotificationsService } from './notifications.service';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(OptionalJwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Chronological notification listing with unread count',
    description:
      'Returns one page of notifications ordered by reception time, newest first, plus the unread count for the red badge.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 20 })
  @ApiOkResponse({ description: 'One page of notifications with the unread count.' })
  list(
    @CurrentUser() user: AuthenticatedUser | null,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.notifications.resolveUserId(user?.id).then((userId) =>
      this.notifications.list(userId, { page, pageSize }),
    );
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark a notification as read',
    description: 'Sets the read timestamp and returns the updated notification with the new unread count.',
  })
  @ApiOkResponse({ description: 'The notification marked as read, with the refreshed unread count.' })
  markAsRead(@CurrentUser() user: AuthenticatedUser | null, @Param('id') id: string) {
    return this.notifications.resolveUserId(user?.id).then((userId) =>
      this.notifications.markAsRead(userId, id),
    );
  }
}
