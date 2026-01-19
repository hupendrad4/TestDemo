import api from './api.service';

export interface DashboardData {
  testCasesSummary: {
    total: number;
    approved: number;
    draft: number;
    deprecated: number;
    automated: number;
    manual: number;
    automationPercentage: string;
  };
  executionSummary: {
    total: number;
    passed: number;
    failed: number;
    blocked: number;
    notRun: number;
    skipped: number;
    passRate: number;
    distribution: {
      passed: string;
      failed: string;
      blocked: string;
      notRun: string;
      skipped: string;
    };
  };
  requirementCoverage: {
    total: number;
    covered: number;
    uncovered: number;
    coveragePercentage: number;
  };
  recentTestRuns: any[];
  trendData: any[];
  riskMetrics: {
    highPriorityFailures: number;
    uncoveredHighPriorityReqs: number;
    failingBuilds: number;
    blockedTests: number;
  };
}

class DashboardService {
  async getWorkspaceDashboard(projectId: string): Promise<DashboardData> {
    const response = await api.get(`/dashboard/${projectId}`);
    return response.data.data;
  }

  async getTestCasesSummary(projectId: string) {
    const response = await api.get(`/dashboard/${projectId}/test-cases-summary`);
    return response.data.data;
  }

  async getExecutionSummary(projectId: string) {
    const response = await api.get(`/dashboard/${projectId}/execution-summary`);
    return response.data.data;
  }

  async getRequirementCoverage(projectId: string) {
    const response = await api.get(`/dashboard/${projectId}/requirement-coverage`);
    return response.data.data;
  }

  async getRecentTestRuns(projectId: string, limit: number = 5) {
    const response = await api.get(`/dashboard/${projectId}/recent-test-runs?limit=${limit}`);
    return response.data.data;
  }

  async getExecutionTrends(projectId: string, days: number = 30) {
    const response = await api.get(`/dashboard/${projectId}/execution-trends?days=${days}`);
    return response.data.data;
  }

  async getRiskMetrics(projectId: string) {
    const response = await api.get(`/dashboard/${projectId}/risk-metrics`);
    return response.data.data;
  }
}

export default new DashboardService();
