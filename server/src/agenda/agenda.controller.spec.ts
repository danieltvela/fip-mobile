import { Test } from '@nestjs/testing';
import { AGENDA_EVENTS } from '@fip/shared';
import { AgendaEventsController } from './agenda-events.controller';

describe('AgendaEventsController', () => {
  let controller: AgendaEventsController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AgendaEventsController],
    }).compile();
    controller = moduleRef.get(AgendaEventsController);
  });

  it('lists all agenda events from shared seed data', () => {
    expect(controller.list()).toEqual([...AGENDA_EVENTS]);
  });
});
