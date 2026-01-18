import apiService from './api.service';

class RequirementService {
  async getSpecs(projectId: string): Promise<any> {
    return apiService.get(`/requirements/projects/${projectId}/specs`);
  }

  async createSpec(projectId: string, data: { name: string; description?: string }): Promise<any> {
    return apiService.post(`/requirements/projects/${projectId}/specs`, data);
  }

  async getRequirements(projectId: string, params?: { specId?: string; status?: string }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.specId) query.append('specId', params.specId);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString();
    return apiService.get(`/requirements/projects/${projectId}${qs ? `?${qs}` : ''}`);
  }

  async createRequirement(projectId: string, data: { requirementSpecId?: string; title: string; description?: string; externalId: string; status?: string; priority?: string }): Promise<any> {
    return apiService.post(`/requirements/projects/${projectId}`, data);
  }

  async linkTestCase(requirementId: string, testCaseId: string): Promise<any> {
    return apiService.post(`/requirements/${requirementId}/test-cases`, { testCaseId });
  }
}

export default new RequirementService();
