import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class SettingRepository extends BaseRepository<Prisma.SettingUncheckedCreateInput> {
  constructor() {
    super((client) => client.setting);
  }

  async upsertMany(settings: Prisma.SettingUncheckedCreateInput[]): Promise<void> {
    await Promise.all(
      settings.map((setting) =>
        this.delegate.upsert({
          where: {
            scope_branchId_category_key: {
              scope: setting.scope,
              branchId: setting.branchId ?? null,
              category: setting.category,
              key: setting.key,
            },
          },
          create: setting,
          update: setting,
        })
      )
    );
  }
}
