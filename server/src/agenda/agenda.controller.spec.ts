import { Test } from '@nestjs/testing';
import { AGENDA_EVENTS } from '@fip/shared';
import { AgendaController } from './agenda.controller';

describe('AgendaController', () => {
  let controller: AgendaController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AgendaController],
    }).compile();
    controller = moduleRef.get(AgendaController);
  });

  it('lists all agenda events from shared seed data', () => {
    expect(controller.list()).toEqual([...AGENDA_EVENTS]);
  });
});
