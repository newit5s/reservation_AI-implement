import { Customer, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { CustomerModel } from '../models';

export class CustomerRepository extends BaseRepository<
  Prisma.CustomerCreateInput,
  Customer,
  Prisma.CustomerUpdateInput
> {
  constructor() {
    super((client) => client.customer);
  }

  async calculateTier(customerId: string) {
    return CustomerModel.calculateTier(customerId);
  }

  async getBookingStats(customerId: string) {
    return CustomerModel.getBookingStats(customerId);
  }

  async refreshStats(customerId: string) {
    await CustomerModel.updateStats(customerId);
    return this.findById(customerId);
  }

  async isBlacklisted(customerId: string) {
    return CustomerModel.checkBlacklist(customerId);
  }
}

export const customerRepository = new CustomerRepository();
