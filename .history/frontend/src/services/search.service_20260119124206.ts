import api from './api.service';

export interface SearchResults {
  testCases: any[];
  testSuites: any[];
  requirements: any[];
  testPlans: any[];
  testRuns: any[];
  defects: any[];
}

class SearchService {
  async globalSearch(query: string, projectId?: string, limit: number = 20): Promise<SearchResults> {
    const params = new URLSearchParams({ query, limit: limit.toString() });
    if (projectId) params.append('projectId', projectId);
    
    const response = await api.get(`/search/global?${params.toString()}`);
    return response.data.data;
  }

  async searchTestCases(filters: {
    projectId?: string;
    query?: string;
    status?: string[];
    priority?: string[];
    executionType?: string[];
    suiteId?: string;
    limit?: number;
    offset?: number;
  }) {
    const params = new URLSearchParams();
    
    if (filters.projectId) params.append('projectId', filters.projectId);
    if (filters.query) params.append('query', filters.query);
    if (filters.status) params.append('status', filters.status.join(','));
    if (filters.priority) params.append('priority', filters.priority.join(','));
    if (filters.executionType) params.append('executionType', filters.executionType.join(','));
    if (filters.suiteId) params.append('suiteId', filters.suiteId);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());
    
    const response = await api.get(`/search/test-cases?${params.toString()}`);
    return response.data.data;
  }

  async quickSearch(query: string, entityType: string, projectId?: string, limit: number = 10) {
    const params = new URLSearchParams({ query, entityType, limit: limit.toString() });
    if (projectId) params.append('projectId', projectId);
    
    const response = await api.get(`/search/quick?${params.toString()}`);
    return response.data.data;
  }
}

export default new SearchService();
