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
  jiraProject?: JiraProject;
}

export const jiraService = {
  // Setup Jira integration
  async setupIntegration(
    testProjectId: string,
    data: {
      jiraUrl: string;
      authType: 'OAUTH' | 'API_TOKEN' | 'BASIC';
      accessToken?: string;
      apiToken?: string;
      email?: string;
    }
  ) {
    const response = await api.post(`/jira/integration/${testProjectId}`, data);
    return response.data;
  },

  // Get Jira integration settings
  async getIntegration(testProjectId: string) {
    const response = await api.get(`/jira/integration/${testProjectId}`);
    return response.data.data as JiraIntegration | null;
  },

  // Toggle integration on/off
  async toggleIntegration(testProjectId: string, isActive: boolean) {
    const response = await api.patch(`/jira/integration/${testProjectId}/toggle`, { isActive });
    return response.data;
  },

  // Get available Jira projects
  async getJiraProjects(testProjectId: string) {
    const response = await api.get(`/jira/projects/${testProjectId}`);
    return response.data.data as JiraProject[];
  },

  // Map Jira project for sync
  async mapJiraProject(
    testProjectId: string,
    data: {
      jiraProjectKey: string;
      jiraProjectId: string;
      jiraProjectName: string;
      issueTypeMapping?: any;
    }
  ) {
    const response = await api.post(`/jira/projects/${testProjectId}/map`, data);
    return response.data;
  },

  // Get issue types for a project
  async getIssueTypes(testProjectId: string, projectKey: string) {
    const response = await api.get(`/jira/projects/${testProjectId}/${projectKey}/issue-types`);
    return response.data.data;
  },

  // Search Jira issues
  async searchIssues(testProjectId: string, jql: string, maxResults: number = 50) {
    const response = await api.get(`/jira/search/${testProjectId}`, {
      params: { jql, maxResults },
    });
    return response.data.data as JiraIssue[];
  },

  // Link entity to Jira issue
  async linkEntity(
    testProjectId: string,
    data: {
      jiraIssueKey: string;
      entityType: 'TEST_SUITE' | 'TEST_CASE' | 'TEST_PLAN' | 'DEFECT';
      entityId: string;
      jiraProjectId: string;
    }
  ) {
    const response = await api.post(`/jira/link/${testProjectId}`, data);
    return response.data;
  },

  // Unlink entity from Jira
  async unlinkEntity(jiraIssueKey: string, entityType: string, entityId: string) {
    const response = await api.post('/jira/unlink', {
      jiraIssueKey,
      entityType,
      entityId,
    });
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
