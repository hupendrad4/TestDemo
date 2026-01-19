import apiService from './api.service';

export interface TestPlan {
  id: string;
  name: string;
  description: string;
  projectId: string;
  startDate?: string;
  endDate?: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  createdBy: { id: string; firstName: string; lastName: string };
  testCases?: any[];
  platforms?: Platform[];
  milestones?: Milestone[];
  createdAt: string;
  updatedAt: string;
}

export interface Platform {
  id: string;
  name: string;
  type: 'OS' | 'BROWSER' | 'DEVICE' | 'OTHER';
  version?: string;
  projectId: string;
}

export interface Configuration {
  id: string;
  name: string;
  description?: string;
  properties: Record<string, any>;
  projectId: string;
}

export interface Milestone {
  id: string;
  name: string;
  description?: string;
  dueDate?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  projectId: string;
}

export interface Build {
  id: string;
  name: string;
  version: string;
  description?: string;
  releaseDate?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'RELEASED' | 'ARCHIVED';
  projectId: string;
}

class TestPlanService {
  async getTestPlans(projectId: string): Promise<TestPlan[]> {
    const response = await apiService.get(`/test-plans/projects/${projectId}`);
    return response.data;
  }

  async getTestPlanById(id: string): Promise<TestPlan> {
    const response = await apiService.get(`/test-plans/${id}`);
    return response.data;
  }

  async createTestPlan(data: {
    name: string;
    description?: string;
    projectId: string;
    testCaseIds?: string[];
    milestoneIds?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<TestPlan> {
    const { projectId, ...payload } = data;
    const response = await apiService.post(`/test-plans/projects/${projectId}`, payload);
    return response.data;
  }

  async updateTestPlan(id: string, data: Partial<TestPlan>): Promise<TestPlan> {
    const response = await apiService.put(`/test-plans/${id}`, data);
    return response.data;
  }

  async deleteTestPlan(id: string): Promise<void> {
    await apiService.delete(`/test-plans/${id}`);
  }

  async addTestCases(planId: string, testCaseIds: string[]): Promise<void> {
    await apiService.post(`/test-plans/${planId}/test-cases`, { testCaseIds });
  }

  async removeTestCase(planId: string, testCaseId: string): Promise<void> {
    await apiService.delete(`/test-plans/${planId}/test-cases/${testCaseId}`);
  }

  // Platforms
  async getPlatforms(projectId: string): Promise<Platform[]> {
    const response = await apiService.get(`/projects/${projectId}/platforms`);
    return response.data;
  }

  async createPlatform(data: Omit<Platform, 'id'>): Promise<Platform> {
    const { projectId, ...payload } = data;
    const response = await apiService.post(`/projects/${projectId}/platforms`, payload);
    return response.data;
  }

  async deletePlatform(id: string): Promise<void> {
    await apiService.delete(`/platforms/${id}`);
  }

  // Configurations
  async getConfigurations(projectId: string): Promise<Configuration[]> {
    const response = await apiService.get(`/configurations?projectId=${projectId}`);
    return response.data;
  }

  async createConfiguration(data: Omit<Configuration, 'id'>): Promise<Configuration> {
    const response = await apiService.post('/configurations', data);
    return response.data;
  }

  // Milestones
  async getMilestones(projectId: string): Promise<Milestone[]> {
    const response = await apiService.get(`/projects/${projectId}/milestones`);
    return response.data;
  }

  async createMilestone(data: Omit<Milestone, 'id'>): Promise<Milestone> {
    const { projectId, ...payload } = data;
    const response = await apiService.post(`/projects/${projectId}/milestones`, payload);
    return response.data;
  }

  // Builds
  async getBuilds(projectId: string): Promise<Build[]> {
    const response = await apiService.get(`/builds?projectId=${projectId}`);
    return response.data;
  }

  async createBuild(data: Omit<Build, 'id'>): Promise<Build> {
    const response = await apiService.post('/builds', data);
    return response.data;
  }
}

export default new TestPlanService();
