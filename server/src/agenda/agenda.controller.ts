import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AGENDA_EVENTS, AgendaEvent } from '@fip/shared';
import { AgendaEventDto } from './agenda-event.dto';

@ApiTags('agenda')
@Controller('agenda')
export class AgendaController {
  @Get()
  @ApiOperation({
    summary: 'List all FIP agenda events',
    description: 'Returns the full agenda; the client applies filters and favorites.',
  })
  @ApiOkResponse({ type: [AgendaEventDto] })
  list(): readonly AgendaEvent[] {
    return AGENDA_EVENTS;
  }
}
