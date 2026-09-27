import { Body, ConflictException, Controller, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { Roles, RolesGuard } from '../common/roles.guard';
import { hashPassword } from '../common/password';
import { UserRole, type CreateJournalistDto } from '@fip/shared';

export class CreateJournalistBody implements CreateJournalistDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsIn(['PRESS_TEAM', 'JOURNALIST'])
  role?: UserRole;
}

@ApiTags('journalists')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('PRESS_TEAM')
@Controller('journalists')
export class JournalistsController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async create(@Body() body: CreateJournalistBody) {
    try {
      return await this.prisma.user.create({
        data: {
          email: body.email,
          name: body.name,
          passwordHash: hashPassword(body.password),
          role: body.role ?? 'JOURNALIST',
        },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A user with that email already exists');
      }
      throw error;
    }
  }

  @Get()
  async list() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('Journalist not found');
    return user;
  }
}
