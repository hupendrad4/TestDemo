import apiService from './api.service';

export interface AITestSuggestion {
  id: string;
  title: string;
  description: string;
  confidence: number;
  type: string;
  status: string;
  createdAt: string;
}

export interface FlakyTest {
  id: string;
  testCaseId: string;
  testCaseName: string;
  flakinesScore: number;
  totalRuns: number;
  failedRuns: number;
  consecutiveFlips: number;
  detectedAt: string;
}

export interface CoverageGap {
  requirementId: string;
  requirementTitle: string;
  priority: string;
  hasTests: boolean;
}

class AIService {
  /**
   * Generate AI test suggestions from requirements
   */
  async generateTests(data: {
    testProjectId: string;
    requirementId?: string;
    description: string;
  }) {
    return apiService.post('/ai/generate-tests', data);
  }

  /**
   * Get AI suggestions for a project
   */
  async getSuggestions(projectId: string, filters?: { status?: string; type?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    
    return apiService.get(`/ai/suggestions/${projectId}?${params.toString()}`);
  }

  /**
   * Accept an AI suggestion
   */
  async acceptSuggestion(suggestionId: string) {
    return apiService.post(`/ai/suggestions/${suggestionId}/accept`, {});
  }

  /**
   * Reject an AI suggestion
   */
  async rejectSuggestion(suggestionId: string, reason?: string) {
    return apiService.post(`/ai/suggestions/${suggestionId}/reject`, { reason });
  }

  /**
   * Detect duplicate test cases
   */
  async detectDuplicates(projectId: string) {
    return apiService.get(`/ai/detect-duplicates/${projectId}`);
  }

  /**
   * Detect flaky tests
   */
  async detectFlaky(testCaseId: string, runs: any[]) {
    return apiService.post('/ai/detect-flaky', { testCaseId, runs });
  }

  /**
   * Get coverage gaps
   */
  async getCoverageGaps(projectId: string) {
    return apiService.get(`/ai/coverage-gaps/${projectId}`);
  }

  /**
   * Generate AI report
   */
  async generateReport(data: {
    testProjectId: string;
    reportType: string;
    prompt?: string;
  }) {
    return apiService.post('/ai/generate-report', data);
  }

  /**
   * Suggest improvements for a test case
   */
  async suggestImprovements(testCaseId: string) {
    return apiService.post('/ai/suggest-improvements', { testCaseId });
  }
}

export default new AIService();
