import { Prisma, User } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository<Prisma.UserUncheckedCreateInput> {
  constructor() {
    super((client) => client.user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.delegate.findUnique({ where: { email } });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.delegate.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
  }

  async setPassword(id: string, passwordHash: string): Promise<void> {
    await this.delegate.update({
      where: { id },
      data: { passwordHash },
    });
  }
}
