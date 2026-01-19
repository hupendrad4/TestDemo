import { PrismaClient, EntityType } from '@prisma/client';

const prisma = new PrismaClient();

export class SavedViewService {
  /**
   * Create a saved view
   */
  static async createView(data: {
    name: string;
    description?: string;
    entityType: EntityType;
    filters: any;
    columns?: any;
    userId: string;
    isPublic?: boolean;
    isDefault?: boolean;
  }) {
    // If setting as default, unset other defaults first
    if (data.isDefault) {
      await prisma.savedView.updateMany({
        where: {
          userId: data.userId,
          entityType: data.entityType,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    return await prisma.savedView.create({
      data,
    });
  }

  /**
   * Get user's saved views
   */
  static async getUserViews(userId: string, entityType?: EntityType) {
    const where: any = {
      OR: [{ userId }, { isPublic: true }],
    };

    if (entityType) {
      where.entityType = entityType;
    }

    return await prisma.savedView.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
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
   * Get default view for entity type
   */
  static async getDefaultView(userId: string, entityType: EntityType) {
    return await prisma.savedView.findFirst({
      where: {
        userId,
        entityType,
        isDefault: true,
      },
    });
  }

  /**
   * Update saved view
   */
  static async updateView(viewId: string, userId: string, data: {
    name?: string;
    description?: string;
    filters?: any;
    columns?: any;
    isPublic?: boolean;
    isDefault?: boolean;
  }) {
    // If setting as default, unset other defaults first
    if (data.isDefault) {
      const view = await prisma.savedView.findUnique({ where: { id: viewId } });
      if (view) {
        await prisma.savedView.updateMany({
          where: {
            userId,
            entityType: view.entityType,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }
    }

    return await prisma.savedView.update({
      where: { id: viewId },
      data,
    });
  }

  /**
   * Delete saved view
   */
  static async deleteView(viewId: string) {
    return await prisma.savedView.delete({
      where: { id: viewId },
    });
  }

  /**
   * Get view by ID
   */
  static async getViewById(viewId: string) {
    return await prisma.savedView.findUnique({
      where: { id: viewId },
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
}

export default SavedViewService;
