import { PrismaClient, NotificationType, EntityType } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    entityType?: EntityType;
    entityId?: string;
  }) {
    return await prisma.notification.create({
      data,
    });
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId: string, limit: number = 50) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string) {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string) {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string) {
    return await prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Notify about test execution failure
   */
  static async notifyExecutionFailed(executionId: string, testCaseId: string, assignedUserId: string) {
    const testCase = await prisma.testCase.findUnique({
      where: { id: testCaseId },
      select: { name: true, externalId: true },
    });

    if (testCase) {
      await this.createNotification({
        userId: assignedUserId,
        type: NotificationType.EXECUTION_FAILED,
        title: 'Test Execution Failed',
        message: `Test case ${testCase.externalId} - ${testCase.name} has failed`,
        entityType: EntityType.EXECUTION,
        entityId: executionId,
      });
    }
  }

  /**
   * Notify about assignment
   */
  static async notifyAssignment(userId: string, entityType: EntityType, entityId: string, entityName: string) {
    await this.createNotification({
      userId,
      type: NotificationType.ASSIGNMENT,
      title: 'New Assignment',
      message: `You have been assigned to ${entityName}`,
      entityType,
      entityId,
    });
  }

  /**
   * Notify about mention in comment
   */
  static async notifyMention(userId: string, mentionedBy: string, entityType: EntityType, entityId: string) {
    const user = await prisma.user.findUnique({
      where: { id: mentionedBy },
      select: { firstName: true, lastName: true, username: true },
    });

    const mentioner = user?.firstName ? `${user.firstName} ${user.lastName}` : user?.username || 'Someone';

    await this.createNotification({
      userId,
      type: NotificationType.MENTION,
      title: 'You were mentioned',
      message: `${mentioner} mentioned you in a comment`,
      entityType,
      entityId,
    });
  }
}

export default NotificationService;
