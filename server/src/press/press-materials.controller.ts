import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PressMaterialPage } from '@fip/shared';
import { PressMaterialsService } from './press-materials.service';

@ApiTags('press')
@Controller('press/materials')
export class PressMaterialsController {
  constructor(private readonly pressMaterials: PressMaterialsService) {}

  @Get()
  @ApiOperation({
    summary: 'Paginated press material listing, newest first',
    description: 'Returns one page of materials ordered by publication date, descending.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10 })
  @ApiOkResponse({ description: 'One page of press materials.' })
  list(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ): PressMaterialPage {
    return this.pressMaterials.list(page, pageSize);
  }
}
