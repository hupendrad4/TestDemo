import apiService from './api.service';

export interface Defect {
  id: string;
  externalId: string;
  defectId?: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'BLOCKER';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'BLOCKER';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REOPEN' | 'REJECTED';
  type?: 'BUG' | 'DEFECT' | 'ENHANCEMENT' | 'ISSUE';
  environment?: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  expectedResult?: string;
  actualResult?: string;
  attachments?: string[];
  reportedBy: { id: string; username: string; email: string };
  assignedTo?: { id: string; username: string; email: string };
  testCaseId?: string;
  executionId?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface CreateDefectData {
  title: string;
  description?: string;
  severity: string;
  priority: string;
  type?: string;
  environment?: string;
  stepsToReproduce?: string;
  expectedResult?: string;
  actualResult?: string;
  projectId: string;
  assignedToId?: string;
  testCaseId?: string;
  executionId?: string;
  jiraIssueKey?: string;
}

class DefectService {
  async getDefects(projectId: string, filters?: {
    status?: string;
    severity?: string;
    priority?: string;
    type?: string;
    assignedToId?: string;
    reportedById?: string;
    search?: string;
  }): Promise<Defect[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.assignedToId) params.append('assignedToId', filters.assignedToId);
    if (filters?.reportedById) params.append('reportedById', filters.reportedById);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const response: any = await apiService.get(`/defects/projects/${projectId}${queryString ? '?' + queryString : ''}`);
    return response.data || [];
  }

  async getDefectById(id: string): Promise<Defect> {
    const response: any = await apiService.get(`/defects/${id}`);
    return response.data;
  }

  async createDefect(data: CreateDefectData): Promise<Defect> {
    const response: any = await apiService.post(`/defects/projects/${data.projectId}`, data);
    return response.data;
  }

  async updateDefect(id: string, data: Partial<CreateDefectData> & { status?: string }): Promise<Defect> {
    const response: any = await apiService.put(`/defects/${id}`, data);
    return response.data;
  }

  async deleteDefect(id: string): Promise<void> {
    await apiService.delete(`/defects/${id}`);
  }

  async linkTestCase(defectId: string, testCaseId: string): Promise<void> {
    await apiService.post(`/defects/${defectId}/test-cases`, { testCaseId });
  }

  async unlinkTestCase(defectId: string, testCaseId: string): Promise<void> {
    await apiService.delete(`/defects/${defectId}/test-cases/${testCaseId}`);
  }

  async getDefectStats(projectId: string): Promise<{
    total: number;
    new?: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    bySeverity: Record<string, number>;
  }> {
    const response: any = await apiService.get(`/defects/projects/${projectId}/stats`);
    return response.data;
  }
}

export default new DefectService();
