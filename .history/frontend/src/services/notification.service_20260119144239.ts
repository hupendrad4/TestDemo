import api from './api.service';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

class NotificationService {
  async getNotifications(limit: number = 50): Promise<Notification[]> {
    const response = await api.get(`/notifications?limit=${limit}`);
    return response.data.data;
  }

  async getUnreadCount(): Promise<number> {
    const response = await api.get('/notifications/unread-count');
    return response.data.data.count;
  }

  async markAsRead(notificationId: string): Promise<void> {
    await api.patch(`/notifications/${notificationId}/read`);
  }

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/mark-all-read');
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`/notifications/${notificationId}`);
  }
}

export default new NotificationService();
