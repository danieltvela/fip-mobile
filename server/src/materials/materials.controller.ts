import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IsBoolean, IsIn, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { Roles, RolesGuard } from '../common/roles.guard';

export const MATERIAL_TYPES = ['PRESS_RELEASE', 'NOTE', 'PHOTOGRAPH', 'VIDEO', 'AUDIO'] as const;

export class CreateMaterialBody {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsIn(MATERIAL_TYPES)
  type!: (typeof MATERIAL_TYPES)[number];

  @IsString()
  @MinLength(1)
  topic!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsUrl()
  mediaUrl?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdateMaterialBody {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsIn(MATERIAL_TYPES)
  type?: (typeof MATERIAL_TYPES)[number];

  @IsOptional()
  @IsString()
  @MinLength(1)
  topic?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsUrl()
  mediaUrl?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

@ApiTags('materials')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('PRESS_TEAM')
@Controller('materials')
export class MaterialsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.pressMaterial.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const material = await this.prisma.pressMaterial.findUnique({ where: { id } });
    if (!material) throw new NotFoundException('Material not found');
    return material;
  }

  @Post()
  create(@Body() body: CreateMaterialBody) {
    return this.prisma.pressMaterial.create({ data: body });
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateMaterialBody) {
    await this.assertExists(id);
    return this.prisma.pressMaterial.update({ where: { id }, data: body });
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.assertExists(id);
    await this.prisma.pressMaterial.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertExists(id: string) {
    const material = await this.prisma.pressMaterial.findUnique({ where: { id } });
    if (!material) throw new NotFoundException('Material not found');
    return material;
  }
}
