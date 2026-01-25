import apiService from './api.service';

export interface TestExecution {
  id: string;
  testCaseId: string;
  testCycleId?: string;
  buildId?: string;
  executedById: string;
  environmentId?: string;
  status: 'PASSED' | 'FAILED' | 'BLOCKED' | 'NOT_RUN' | 'SKIPPED';
  executionTime?: number;
  notes?: string;
  executedAt: string;
  updatedAt: string;
  testCase?: {
    id: string;
    externalId: string;
    name: string;
    priority: string;
  };
  executedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

class ExecutionService {
  async createTestCycle(testPlanId: string, data: { name: string; description?: string; type?: string; buildId?: string; testCaseIds?: string[] }): Promise<any> {
    return apiService.post(`/executions/test-plans/${testPlanId}/cycles`, data);
  }

  async getTestCycle(cycleId: string): Promise<any> {
    return apiService.get(`/executions/cycles/${cycleId}`);
  }

  async getExecutions(cycleId: string, status?: string): Promise<any> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiService.get(`/executions/cycles/${cycleId}/executions${qs}`);
  }

  async getAllExecutions(projectId: string, filters?: { status?: string; executedById?: string }): Promise<TestExecution[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.executedById) params.append('executedById', filters.executedById);
    const queryString = params.toString();
    const url = `/executions/projects/${projectId}${queryString ? `?${queryString}` : ''}`;
    const response: any = await apiService.get(url);
    return response.data || response || [];
  }

  async getMyExecutions(projectId: string): Promise<TestExecution[]> {
    const response: any = await apiService.get(`/executions/projects/${projectId}/my-executions`);
    return response.data || response || [];
  }

  async assignExecution(executionId: string, userId: string): Promise<any> {
    return apiService.put(`/executions/${executionId}/assign`, { userId });
  }

  async bulkAssignExecutions(testCaseIds: string[], userId: string, buildId?: string): Promise<any> {
    return apiService.post('/executions/bulk-assign', { testCaseIds, userId, buildId });
  }

  async executeTestCase(executionId: string, data: { status?: string; notes?: string; executionTime?: number; stepResults?: Array<{ testStepId: string; status: string; actualResult?: string; notes?: string }> }): Promise<any> {
    return apiService.put(`/executions/executions/${executionId}`, data);
  }

  async getStats(cycleId: string): Promise<any> {
    return apiService.get(`/executions/cycles/${cycleId}/stats`);
  }
}

export default new ExecutionService();
