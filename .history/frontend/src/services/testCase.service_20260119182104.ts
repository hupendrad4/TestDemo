import apiService from './api.service';

export interface TestCase {
  id: string;
  testCaseId: string;
  title: string;
  description: string;
  preconditions: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'DRAFT' | 'APPROVED' | 'DEPRECATED';
  automationStatus: 'NOT_AUTOMATED' | 'AUTOMATED' | 'TO_BE_AUTOMATED';
  type: 'FUNCTIONAL' | 'NON_FUNCTIONAL' | 'SECURITY' | 'PERFORMANCE' | 'USABILITY' | 'OTHER';
  estimatedTime: number;
  tags: string[];
  customFields: any;
  suiteId?: string;
  suite?: { id: string; name: string };
  createdBy: { id: string; firstName: string; lastName: string };
  assignedTo?: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  testCases?: TestCase[];
  children?: TestSuite[];
}

export interface CreateTestCaseData {
  title: string;
  description?: string;
  preconditions?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  priority?: string;
  type?: string;
  automationStatus?: string;
  estimatedTime?: number;
  tags?: string[];
  suiteId?: string;
  assignedToId?: string;
}

export interface UpdateTestCaseData extends Partial<CreateTestCaseData> {
  status?: string;
}

export interface CreateTestSuiteData {
  name: string;
  description?: string;
  parentId?: string;
  projectId: string;
}

class TestCaseService {
  async getTestCases(projectId: string, filters?: {
    suiteId?: string;
    status?: string;
    priority?: string;
    assignedToId?: string;
    search?: string;
  }): Promise<TestCase[]> {
    const params = new URLSearchParams();
    if (filters?.suiteId) params.append('suiteId', filters.suiteId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.assignedToId) params.append('assignedToId', filters.assignedToId);
    if (filters?.search) params.append('search', filters.search);

    const response = await apiService.get(`/test-cases?projectId=${projectId}&${params.toString()}`);
    return response.data;
  }

  async getTestCaseById(id: string): Promise<TestCase> {
    const response = await apiService.get(`/test-cases/${id}`);
    return response.data;
  }

  async createTestCase(projectId: string, data: CreateTestCaseData): Promise<TestCase> {
    const response = await apiService.post(`/test-cases/projects/${projectId}`, data);
    return response.data;
  }

  async updateTestCase(id: string, data: UpdateTestCaseData): Promise<TestCase> {
    const response = await apiService.put(`/test-cases/${id}`, data);
    return response.data;
  }

  async deleteTestCase(id: string): Promise<void> {
    await apiService.delete(`/test-cases/${id}`);
  }

  async bulkUpdateTestCases(ids: string[], data: UpdateTestCaseData): Promise<void> {
    await apiService.put('/test-cases/bulk', { ids, data });
  }

  async moveTestCase(id: string, suiteId: string | null): Promise<void> {
    await apiService.put(`/test-cases/${id}/move`, { suiteId });
  }

  // Test Suites
  async getTestSuites(projectId: string): Promise<TestSuite[]> {
    const response = await apiService.get(`/test-suites?projectId=${projectId}`);
    return response.data;
  }

  async getTestSuiteById(id: string): Promise<TestSuite> {
    const response = await apiService.get(`/test-suites/${id}`);
    return response.data;
  }

  async createTestSuite(data: CreateTestSuiteData): Promise<TestSuite> {
    const response = await apiService.post('/test-suites', data);
    return response.data;
  }

  async updateTestSuite(id: string, data: { name?: string; description?: string }): Promise<TestSuite> {
    const response = await apiService.put(`/test-suites/${id}`, data);
    return response.data;
  }

  async deleteTestSuite(id: string): Promise<void> {
    await apiService.delete(`/test-suites/${id}`);
  }

  async moveTestSuite(id: string, parentId: string | null): Promise<void> {
    await apiService.put(`/test-suites/${id}/move`, { parentId });
  }
}

export default new TestCaseService();
