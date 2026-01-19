import api from './api.service';

export interface TestStep {
  id: string;
  stepNumber: number;
  description: string;
  expectedResult: string;
  actualResult?: string;
  status: 'NOT_EXECUTED' | 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED';
  attachments?: string[];
  notes?: string;
}

export interface TestExecution {
  id: string;
  executionId: string;
  testCaseId: string;
  testCase: {
    id: string;
    testCaseId: string;
    title: string;
    description: string;
    priority: string;
  };
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED';
  assignedToId: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  environment?: string;
  build?: string;
  platform?: string;
  steps: TestStep[];
  startTime?: string;
  endTime?: string;
  duration?: number;
  notes?: string;
  defects?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionFilters {
  projectId: string;
  status?: string;
  assignedToId?: string;
  testPlanId?: string;
  search?: string;
}

export interface ExecutionStats {
  total: number;
  notStarted: number;
  inProgress: number;
  passed: number;
  failed: number;
  blocked: number;
  skipped: number;
  passRate: number;
}

class Execution2Service {
  async getExecutions(filters: ExecutionFilters): Promise<TestExecution[]> {
    const response = await api.get('/executions', { params: filters });
    return response.data;
  }

  async getExecutionById(executionId: string): Promise<TestExecution> {
    const response = await api.get(`/executions/${executionId}`);
    return response.data;
  }

  async startExecution(executionId: string): Promise<TestExecution> {
    const response = await api.post(`/executions/${executionId}/start`);
    return response.data;
  }

  async updateExecutionStatus(
    executionId: string,
    status: string,
    notes?: string
  ): Promise<TestExecution> {
    const response = await api.patch(`/executions/${executionId}/status`, {
      status,
      notes,
    });
    return response.data;
  }

  async updateStepResult(
    executionId: string,
    stepId: string,
    data: {
      actualResult?: string;
      status: string;
      notes?: string;
    }
  ): Promise<TestStep> {
    const response = await api.patch(
      `/executions/${executionId}/steps/${stepId}`,
      data
    );
    return response.data;
  }

  async bulkUpdateSteps(
    executionId: string,
    steps: Array<{ stepId: string; status: string; actualResult?: string }>
  ): Promise<TestExecution> {
    const response = await api.patch(`/executions/${executionId}/steps/bulk`, {
      steps,
    });
    return response.data;
  }

  async uploadAttachment(
    executionId: string,
    stepId: string,
    file: File
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(
      `/executions/${executionId}/steps/${stepId}/attachments`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data.url;
  }

  async linkDefect(executionId: string, defectId: string): Promise<void> {
    await api.post(`/executions/${executionId}/defects`, { defectId });
  }

  async getExecutionStats(projectId: string): Promise<ExecutionStats> {
    const response = await api.get(`/executions/stats`, { params: { projectId } });
    return response.data;
  }
}

export default new Execution2Service();
