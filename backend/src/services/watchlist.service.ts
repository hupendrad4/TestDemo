import { PrismaClient, EntityType } from '@prisma/client';

const prisma = new PrismaClient();

export class WatchlistService {
  /**
   * Add item to watchlist
   */
  static async addToWatchlist(userId: string, entityType: EntityType, entityId: string, testRunId?: string) {
    // Check if already exists
    const existing = await prisma.watchlistEntry.findUnique({
      where: {
        userId_entityType_entityId: {
          userId,
          entityType,
          entityId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return await prisma.watchlistEntry.create({
      data: {
        userId,
        entityType,
        entityId,
        testRunId,
      },
    });
  }

  /**
   * Remove item from watchlist
   */
  static async removeFromWatchlist(userId: string, entityType: EntityType, entityId: string) {
    return await prisma.watchlistEntry.delete({
      where: {
        userId_entityType_entityId: {
          userId,
          entityType,
          entityId,
        },
      },
    });
  }

  /**
   * Get user watchlist
   */
  static async getUserWatchlist(userId: string, entityType?: EntityType) {
    const where: any = { userId };
    if (entityType) {
      where.entityType = entityType;
    }

    return await prisma.watchlistEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        testRun: {
          select: {
            id: true,
            name: true,
            status: true,
            progress: true,
          },
        },
      },
    });
  }

  /**
   * Check if item is in watchlist
   */
  static async isWatching(userId: string, entityType: EntityType, entityId: string): Promise<boolean> {
    const entry = await prisma.watchlistEntry.findUnique({
      where: {
        userId_entityType_entityId: {
          userId,
          entityType,
          entityId,
        },
      },
    });

    return !!entry;
  }

  /**
   * Get watchers for an entity
   */
  static async getWatchers(entityType: EntityType, entityId: string) {
    return await prisma.watchlistEntry.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Toggle watchlist status
   */
  static async toggleWatch(userId: string, entityType: EntityType, entityId: string, testRunId?: string) {
    const isWatching = await this.isWatching(userId, entityType, entityId);

    if (isWatching) {
      await this.removeFromWatchlist(userId, entityType, entityId);
      return { watching: false };
    } else {
      await this.addToWatchlist(userId, entityType, entityId, testRunId);
      return { watching: true };
    }
  }
}

export default WatchlistService;
