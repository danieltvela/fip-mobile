import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  MATERIAL_TYPES,
  MATERIAL_TOPICS,
  MaterialList,
  MaterialQuery,
  isMaterialTopic,
  isMaterialType,
} from '@fip/shared';
import { MaterialsService } from './materials.service';

@ApiTags('materials')
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  @ApiQuery({ name: 'type', enum: MATERIAL_TYPES, required: false })
  @ApiQuery({ name: 'topic', enum: MATERIAL_TOPICS, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'pageSize', type: Number, required: false })
  @ApiOkResponse({ description: 'Paginated materials, newest first.' })
  @ApiBadRequestResponse({ description: 'Invalid type, topic, or pagination parameter.' })
  async list(
    @Query('type') type?: string,
    @Query('topic') topic?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<MaterialList> {
    if (type !== undefined && !isMaterialType(type)) {
      throw new BadRequestException(`type must be one of: ${MATERIAL_TYPES.join(', ')}`);
    }
    if (topic !== undefined && !isMaterialTopic(topic)) {
      throw new BadRequestException(`topic must be one of: ${MATERIAL_TOPICS.join(', ')}`);
    }

    const query: MaterialQuery = {
      type,
      topic,
      page: parsePositiveInt(page, 'page'),
      pageSize: parsePositiveInt(pageSize, 'pageSize'),
    };
    return this.materialsService.findMaterials(query);
  }
}

function parsePositiveInt(value: string | undefined, name: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new BadRequestException(`${name} must be a positive integer`);
  }
  return parsed;
}
