import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/** Request-scoped Prisma client exposed through Nest DI. */
@Injectable()
export class PrismaService extends PrismaClient {}
