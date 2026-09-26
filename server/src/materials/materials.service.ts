import { Injectable } from '@nestjs/common';
import { Material, MaterialList, MaterialQuery, isRecentMaterial } from '@fip/shared';
import { PrismaService } from '../prisma.service';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMaterials(query: MaterialQuery): Promise<MaterialList> {
    const page = Math.max(1, query.page ?? DEFAULT_PAGE);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE));

    const where = {
      ...(query.type ? { type: query.type } : {}),
      ...(query.topic ? { topic: query.topic } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.material.count({ where }),
      this.prisma.material.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const items: Material[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      type: row.type,
      topic: row.topic,
      createdAt: row.createdAt.toISOString(),
      isNew: isRecentMaterial(row.createdAt),
    }));

    return { items, page, pageSize, total };
  }
}
