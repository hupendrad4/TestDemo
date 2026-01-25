import apiService from './api.service';

export interface Environment {
  id: string;
  name: string;
  description?: string;
  url?: string;
  type: 'DEV' | 'QA' | 'STAGING' | 'UAT' | 'PRODUCTION' | 'CUSTOM';
  isActive: boolean;
  testProjectId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    executions: number;
    testRuns: number;
  };
}

export interface CreateEnvironmentData {
  name: string;
  description?: string;
  url?: string;
  type?: 'DEV' | 'QA' | 'STAGING' | 'UAT' | 'PRODUCTION' | 'CUSTOM';
}

class EnvironmentService {
  async getEnvironments(projectId: string): Promise<Environment[]> {
    const response: any = await apiService.get(`/projects/${projectId}/environments`);
    return response.data || response || [];
  }

  async getEnvironmentById(id: string): Promise<Environment> {
    const response: any = await apiService.get(`/environments/${id}`);
    return response.data || response;
  }

  async createEnvironment(
    projectId: string,
    data: CreateEnvironmentData
  ): Promise<Environment> {
    const response: any = await apiService.post(`/projects/${projectId}/environments`, data);
    return response.data || response;
  }

  async updateEnvironment(id: string, data: Partial<CreateEnvironmentData>): Promise<Environment> {
    const response: any = await apiService.put(`/environments/${id}`, data);
    return response.data || response;
  }

  async deleteEnvironment(id: string): Promise<void> {
    await apiService.delete(`/environments/${id}`);
  }

  async createDefaultEnvironments(projectId: string): Promise<Environment[]> {
    const response: any = await apiService.post(
      `/projects/${projectId}/environments/defaults`
    );
    return response.data || response || [];
  }
}

export const environmentService = new EnvironmentService();
export default environmentService;
