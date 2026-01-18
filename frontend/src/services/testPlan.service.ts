import apiService from './api.service';

export interface TestPlan {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

class TestPlanService {
  async getTestPlans(projectId: string): Promise<any> {
    return apiService.get(`/test-plans/projects/${projectId}`);
  }

  async createTestPlan(projectId: string, data: { name: string; description?: string; isActive?: boolean }): Promise<any> {
    return apiService.post(`/test-plans/projects/${projectId}`, data);
  }

  async getBuilds(testPlanId: string): Promise<any> {
    return apiService.get(`/test-plans/${testPlanId}/builds`);
  }

  async createBuild(testPlanId: string, data: { name: string; description?: string; releaseDate?: string; isActive?: boolean }): Promise<any> {
    return apiService.post(`/test-plans/${testPlanId}/builds`, data);
  }
}

export default new TestPlanService();
