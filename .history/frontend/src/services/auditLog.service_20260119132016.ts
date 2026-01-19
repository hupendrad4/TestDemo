import apiService from './api.service';

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

class AuditLogService {
  async getAuditLogs(filters?: {
    projectId?: string;
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.entityType) params.append('entityType', filters.entityType);
    if (filters?.entityId) params.append('entityId', filters.entityId);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiService.get(`/audit-logs?${params.toString()}`);
    return response.data;
  }

  async getEntityHistory(entityType: string, entityId: string): Promise<AuditLog[]> {
    const response = await apiService.get(`/audit-logs/entity/${entityType}/${entityId}`);
    return response.data;
  }
}

export default new AuditLogService();
