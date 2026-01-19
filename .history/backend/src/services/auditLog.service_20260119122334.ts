import { PrismaClient, EntityType } from '@prisma/client';

const prisma = new PrismaClient();

export class AuditLogService {
  /**
   * Log an action
   */
  static async log(data: {
    userId?: string;
    action: string;
    entityType: EntityType;
    entityId: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return await prisma.auditLog.create({
      data,
    });
  }

  /**
   * Get audit logs for an entity
   */
  static async getEntityLogs(entityType: EntityType, entityId: string, limit: number = 50) {
    return await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Get user activity
   */
  static async getUserActivity(userId: string, limit: number = 100) {
    return await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Search audit logs
   */
  static async searchLogs(filters: {
    userId?: string;
    entityType?: EntityType;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Delete old audit logs
   */
  static async deleteOldLogs(daysToKeep: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
  }

  /**
   * Log test case change
   */
  static async logTestCaseChange(
    testCaseId: string,
    userId: string,
    action: string,
    changes?: any,
    req?: { ip?: string; headers?: any }
  ) {
    await this.log({
      userId,
      action,
      entityType: EntityType.TEST_CASE,
      entityId: testCaseId,
      changes,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
  }

  /**
   * Log execution change
   */
  static async logExecutionChange(
    executionId: string,
    userId: string,
    action: string,
    changes?: any,
    req?: { ip?: string; headers?: any }
  ) {
    await this.log({
      userId,
      action,
      entityType: EntityType.EXECUTION,
      entityId: executionId,
      changes,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
  }
}

export default AuditLogService;
