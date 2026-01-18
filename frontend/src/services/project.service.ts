import apiService from './api.service';

class ProjectService {
  async getProjects(): Promise<any> {
    return apiService.get('/projects');
  }
  async getMyProjects(): Promise<any> {
    return apiService.get('/projects/my-projects');
  }
  async createProject(data: { name: string; prefix: string; description?: string; isActive?: boolean; isPublic?: boolean }): Promise<any> {
    return apiService.post('/projects', data);
  }
}

export default new ProjectService();
