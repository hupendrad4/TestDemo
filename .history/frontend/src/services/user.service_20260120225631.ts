import apiService from './api.service';

class UserService {
  async getUsers(): Promise<any> {
    return apiService.get('/users');
  }
  async createUser(data: { email: string; password: string; firstName?: string; lastName?: string; role?: string; username?: string }): Promise<any> {
    return apiService.post('/users', data);
  }
  async getUserProjects(userId: string): Promise<any> {
    return apiService.get(`/users/${userId}/projects`);
  }
  async updateUserProjects(userId: string, payload: { projectIds?: string[]; assignments?: { projectId: string; role?: string }[] }): Promise<any> {
    return apiService.patch(`/users/${userId}/projects`, payload);
  }
  async updateUserRole(userId: string, role: string): Promise<any> {
    return apiService.patch(`/users/${userId}/role`, { role });
  }
  async setUserActive(userId: string, isActive: boolean): Promise<any> {
    return apiService.patch(`/users/${userId}/status`, { isActive });
  }
  async resetUserPassword(userId: string, password: string): Promise<any> {
    return apiService.patch(`/users/${userId}/reset-password`, { password });
  }
}

export default new UserService();
