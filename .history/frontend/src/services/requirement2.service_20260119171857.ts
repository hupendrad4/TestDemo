import apiService from './api.service';

export interface Requirement {
  id: string;
  requirementId: string;
  title: string;
  description: string;
  type: 'FUNCTIONAL' | 'NON_FUNCTIONAL' | 'BUSINESS' | 'TECHNICAL' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'DRAFT' | 'APPROVED' | 'IMPLEMENTED' | 'VERIFIED' | 'DEPRECATED';
  acceptanceCriteria: string;
  tags: string[];
  projectId: string;
  parentId?: string;
  createdBy: { id: string; firstName: string; lastName: string };
  assignedTo?: { id: string; firstName: string; lastName: string };
  testCases?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRequirementData {
  title: string;
  description?: string;
  type: string;
  priority?: string;
  acceptanceCriteria?: string;
  tags?: string[];
  parentId?: string;
  assignedToId?: string;
  projectId: string;
}

class RequirementService {
  async getRequirements(projectId: string, filters?: {
    status?: string;
    priority?: string;
    type?: string;
    assignedToId?: string;
    search?: string;
  }): Promise<Requirement[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.assignedToId) params.append('assignedToId', filters.assignedToId);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const url = `/requirements/projects/${projectId}${queryString ? `?${queryString}` : ''}`;
    const response = await apiService.get(url);
    return response.data;
  }

  async getRequirementById(id: string): Promise<Requirement> {
    const response = await apiService.get(`/requirements/${id}`);
    return response.data;
  }

  async createRequirement(data: CreateRequirementData): Promise<Requirement> {
    const { projectId, ...payload } = data;
    const response = await apiService.post(`/requirements/projects/${projectId}`, payload);
    return response.data;
  }

  async updateRequirement(id: string, data: Partial<CreateRequirementData> & { status?: string }): Promise<Requirement> {
    const response = await apiService.put(`/requirements/${id}`, data);
    return response.data;
  }

  async deleteRequirement(id: string): Promise<void> {
    await apiService.delete(`/requirements/${id}`);
  }

  async linkTestCase(requirementId: string, testCaseId: string): Promise<void> {
    await apiService.post(`/requirements/${requirementId}/test-cases`, { testCaseId });
  }

  async unlinkTestCase(requirementId: string, testCaseId: string): Promise<void> {
    await apiService.delete(`/requirements/${requirementId}/test-cases/${testCaseId}`);
  }

  async getTraceabilityMatrix(projectId: string): Promise<any> {
    const response = await apiService.get(`/requirements/traceability-matrix?projectId=${projectId}`);
    return response.data;
  }

  async getCoverageStats(projectId: string): Promise<{
    total: number;
    covered: number;
    coveragePercentage: number;
  }> {
    const response = await apiService.get(`/requirements/coverage?projectId=${projectId}`);
    return response.data;
  }
}

export default new RequirementService();
