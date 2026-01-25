import apiService from './api.service';

export interface Milestone {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  testProjectId: string;
  createdAt: string;
  updatedAt: string;
  testPlans?: any[];
}

export interface CreateMilestoneData {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status?: string;
}

class MilestoneService {
  async getMilestones(projectId: string): Promise<Milestone[]> {
    const response: any = await apiService.get(`/projects/${projectId}/milestones`);
    return response.data || response || [];
  }

  async getMilestoneById(id: string): Promise<Milestone> {
    const response: any = await apiService.get(`/milestones/${id}`);
    return response.data || response;
  }

  async createMilestone(projectId: string, data: CreateMilestoneData): Promise<Milestone> {
    const response: any = await apiService.post(`/projects/${projectId}/milestones`, data);
    return response.data || response;
  }

  async updateMilestone(id: string, data: Partial<CreateMilestoneData>): Promise<Milestone> {
    const response: any = await apiService.put(`/milestones/${id}`, data);
    return response.data || response;
  }

  async deleteMilestone(id: string): Promise<void> {
    await apiService.delete(`/milestones/${id}`);
  }
}

export default new MilestoneService();
