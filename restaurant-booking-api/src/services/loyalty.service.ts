import { Prisma, LoyaltyTier, LoyaltyTransactionType, RewardRedemptionStatus } from '@prisma/client';
import { DatabaseService } from './database.service';
import { CustomerModel } from '../models';
import { logger } from '../utils/logger';

interface AwardOptions {
  reason: string;
  points: number;
  metadata?: Prisma.InputJsonValue;
}

export class LoyaltyService {
  static async ensureAccount(customerId: string): Promise<void> {
    const prisma = DatabaseService.getClient();
    const existing = await prisma.loyaltyAccount.findUnique({ where: { customerId } });
    if (existing) {
      return;
    }
    await prisma.loyaltyAccount.create({
      data: { customerId },
    });
  }

  static determineTier(totalBookings: number): LoyaltyTier {
    if (totalBookings >= 20) {
      return LoyaltyTier.VIP;
    }
    if (totalBookings >= 5) {
      return LoyaltyTier.GOLD;
    }
    return LoyaltyTier.REGULAR;
  }

  private static getMultiplier(tier: LoyaltyTier): number {
    switch (tier) {
      case LoyaltyTier.GOLD:
        return 1.1;
      case LoyaltyTier.VIP:
        return 1.2;
      default:
        return 1;
    }
  }

  static async awardPoints(customerId: string, options: AwardOptions): Promise<void> {
    await this.ensureAccount(customerId);
    const prisma = DatabaseService.getClient();
    const account = await prisma.loyaltyAccount.findUnique({ where: { customerId } });
    if (!account) {
      return;
    }

    const multiplier = this.getMultiplier(account.tier);
    const points = Math.max(Math.floor(options.points * multiplier), 0);

    await prisma.$transaction([
      prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          points: { increment: points },
          updatedAt: new Date(),
        },
      }),
      prisma.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          points,
          type: LoyaltyTransactionType.EARN,
          description: options.reason,
          metadata: options.metadata ?? {},
        },
      }),
    ]);

    logger.info('Awarded loyalty points', { customerId, points });
  }

  static async adjustPoints(
    customerId: string,
    points: number,
    reason: string,
    metadata: Prisma.InputJsonValue = {}
  ): Promise<void> {
    await this.ensureAccount(customerId);
    const prisma = DatabaseService.getClient();
    const account = await prisma.loyaltyAccount.findUnique({ where: { customerId } });
    if (!account) {
      return;
    }

    const nextBalance = account.points + points;
    if (nextBalance < 0) {
      throw new Error('Insufficient points for adjustment');
    }

    await prisma.$transaction([
      prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          points: { set: nextBalance },
          updatedAt: new Date(),
        },
      }),
      prisma.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          points,
          type: LoyaltyTransactionType.ADJUST,
          description: reason,
          metadata,
        },
      }),
    ]);
  }

  static async adjustTier(customerId: string): Promise<void> {
    const prisma = DatabaseService.getClient();
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { totalBookings: true },
    });
    if (!customer) {
      return;
    }
    const account = await prisma.loyaltyAccount.findUnique({ where: { customerId } });
    if (!account) {
      return;
    }
    const tier = this.determineTier(customer.totalBookings);
    if (tier !== account.tier) {
      await prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: { tier, updatedAt: new Date() },
      });
      await CustomerModel.recordTimeline(
        customerId,
        'LOYALTY_UPDATED',
        `Loyalty tier updated to ${tier}`,
        { tier }
      );
    }
  }

  static async getStatus(customerId: string) {
    await this.ensureAccount(customerId);
    const prisma = DatabaseService.getClient();
    return prisma.loyaltyAccount.findUnique({
      where: { customerId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
  }

  static async getHistory(customerId: string) {
    await this.ensureAccount(customerId);
    const prisma = DatabaseService.getClient();
    return prisma.loyaltyTransaction.findMany({
      where: { account: { customerId } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  static async getRewards() {
    const prisma = DatabaseService.getClient();
    return prisma.reward.findMany({ where: { isActive: true }, orderBy: { pointsRequired: 'asc' } });
  }

  static async redeemReward(customerId: string, rewardId: string) {
    await this.ensureAccount(customerId);
    const prisma = DatabaseService.getClient();
    const [account, reward] = await Promise.all([
      prisma.loyaltyAccount.findUnique({ where: { customerId } }),
      prisma.reward.findUnique({ where: { id: rewardId } }),
    ]);
    if (!account || !reward) {
      throw new Error('Unable to redeem reward');
    }
    if (account.points < reward.pointsRequired) {
      throw new Error('Insufficient points');
    }

    await prisma.$transaction([
      prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          points: { decrement: reward.pointsRequired },
          updatedAt: new Date(),
        },
      }),
      prisma.rewardRedemption.create({
        data: {
          rewardId,
          customerId,
          accountId: account.id,
          pointsSpent: reward.pointsRequired,
          status: RewardRedemptionStatus.APPROVED,
        },
      }),
      prisma.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          points: -reward.pointsRequired,
          type: LoyaltyTransactionType.REDEEM,
          description: `Redeemed reward ${reward.name}`,
        },
      }),
    ]);

    await CustomerModel.recordTimeline(customerId, 'LOYALTY_UPDATED', 'Reward redeemed', {
      rewardId,
      rewardName: reward.name,
    });
  }

  static async recordReferral(referrerId: string): Promise<void> {
    await this.ensureAccount(referrerId);
    const prisma = DatabaseService.getClient();
    const account = await prisma.loyaltyAccount.findUnique({ where: { customerId: referrerId } });
    if (!account) {
      return;
    }
    await prisma.$transaction([
      prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          totalReferrals: { increment: 1 },
          updatedAt: new Date(),
        },
      }),
      prisma.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          points: 5,
          type: LoyaltyTransactionType.BONUS,
          description: 'Referral bonus',
        },
      }),
    ]);
  }
}
