import apiService from './api.service';

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

  async executeTestCase(executionId: string, data: { status?: string; notes?: string; executionTime?: number; stepResults?: Array<{ testStepId: string; status: string; actualResult?: string; notes?: string }> }): Promise<any> {
    return apiService.put(`/executions/executions/${executionId}`, data);
  }

  async getStats(cycleId: string): Promise<any> {
    return apiService.get(`/executions/cycles/${cycleId}/stats`);
  }
}

export default new ExecutionService();
