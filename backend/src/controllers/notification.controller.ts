import { Request, Response, NextFunction } from 'express';
import NotificationService from '../services/notification.service';

export class NotificationController {
  /**
   * @route   GET /api/notifications
   * @desc    Get user notifications
   * @access  Private
   */
  static async getUserNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const limit = parseInt(req.query.limit as string) || 50;

      const notifications = await NotificationService.getUserNotifications(userId, limit);

      res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/notifications/unread-count
   * @desc    Get unread notification count
   * @access  Private
   */
  static async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;

      const count = await NotificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PATCH /api/notifications/:id/read
   * @desc    Mark notification as read
   * @access  Private
   */
  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const notification = await NotificationService.markAsRead(id);

      res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PATCH /api/notifications/mark-all-read
   * @desc    Mark all notifications as read
   * @access  Private
   */
  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;

      await NotificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   DELETE /api/notifications/:id
   * @desc    Delete notification
   * @access  Private
   */
  static async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await NotificationService.deleteNotification(id);

      res.status(200).json({
        success: true,
        message: 'Notification deleted',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default NotificationController;
