import api from './api.service';

export interface JiraIntegration {
  id: string;
  jiraUrl: string;
  authType: 'OAUTH' | 'API_TOKEN' | 'BASIC';
  email?: string;
  isActive: boolean;
  syncEnabled: boolean;
  lastSyncAt?: string;
  jiraProjects?: JiraProject[];
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  syncEnabled: boolean;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
    };
    issuetype: {
      name: string;
    };
    project: {
      key: string;
      id: string;
      name: string;
    };
  };
}

export interface JiraLink {
  id: string;
  jiraIssueKey: string;
  jiraIssueId: string;
  jiraIssueType: string;
  jiraIssueSummary: string;
  jiraIssueStatus: string;
  entityType: 'TEST_SUITE' | 'TEST_CASE' | 'TEST_PLAN' | 'DEFECT';
  entityId: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'FAILED' | 'CONFLICT';
  lastSyncedAt: string;
  createdAt: string;
}

const jiraService = {
  // Setup Jira integration
  async setupIntegration(projectId: string, data: {
    jiraUrl: string;
    authType: 'OAUTH' | 'API_TOKEN' | 'BASIC';
    email?: string;
    apiToken?: string;
    accessToken?: string;
    refreshToken?: string;
  }) {
    const response = await api.post(`/jira/integration/${projectId}`, data);
    return response.data.data as JiraIntegration;
  },

  // Get Jira integration for a project
  async getIntegration(projectId: string) {
    const response = await api.get(`/jira/integration/${projectId}`);
    return response.data.data as JiraIntegration;
  },

  // Toggle Jira integration
  async toggleIntegration(projectId: string, isActive: boolean) {
    const response = await api.put(`/jira/integration/${projectId}/toggle`, {
      isActive,
    });
    return response.data.data as JiraIntegration;
  },

  // Get Jira projects
  async getJiraProjects(projectId: string) {
    const response = await api.get(`/jira/projects/${projectId}`);
    return response.data.data as JiraProject[];
  },

  // Map Jira project
  async mapJiraProject(projectId: string, jiraProjectKey: string, syncEnabled: boolean = true) {
    const response = await api.post(`/jira/projects/${projectId}/map`, {
      jiraProjectKey,
      syncEnabled,
    });
    return response.data.data as JiraProject;
  },

  // Unmap Jira project
  async unmapJiraProject(projectId: string, jiraProjectKey: string) {
    const response = await api.delete(`/jira/projects/${projectId}/map/${jiraProjectKey}`);
    return response.data;
  },

  // Search Jira issues
  async searchIssues(projectId: string, query: string) {
    const response = await api.get(`/jira/issues/${projectId}/search`, {
      params: { query },
    });
    return response.data.data as JiraIssue[];
  },

  // Link entity to Jira issue
  async linkToJira(projectId: string, data: {
    entityType: 'TEST_SUITE' | 'TEST_CASE' | 'TEST_PLAN' | 'DEFECT';
    entityId: string;
    jiraIssueKey: string;
  }) {
    const response = await api.post(`/jira/link/${projectId}`, data);
    return response.data.data as JiraLink;
  },

  // Unlink entity from Jira issue
  async unlinkFromJira(projectId: string, linkId: string) {
    const response = await api.delete(`/jira/link/${projectId}/${linkId}`);
    return response.data;
  },

  // Get Jira links for an entity
  async getEntityLinks(entityType: string, entityId: string) {
    const response = await api.get(`/jira/links/${entityType}/${entityId}`);
    return response.data.data as JiraLink[];
  },

  // Sync entity to Jira
  async syncToJira(entityType: string, entityId: string) {
    const response = await api.post('/jira/sync/to-jira', {
      entityType,
      entityId,
    });
    return response.data;
  },

  // Sync from Jira
  async syncFromJira(jiraIssueKey: string) {
    const response = await api.post('/jira/sync/from-jira', {
      jiraIssueKey,
    });
    return response.data;
  },
};

export default jiraService;
