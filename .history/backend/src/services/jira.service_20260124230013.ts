import axios, { AxiosInstance } from 'axios';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface JiraConfig {
  jiraUrl: string;
  authType: 'OAUTH' | 'API_TOKEN' | 'BASIC';
  accessToken?: string;
  apiToken?: string;
  email?: string;
}

interface JiraIssue {
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
    description?: string;
    project: {
      key: string;
      id: string;
      name: string;
    };
  };
}

interface JiraProject {
  id: string;
  key: string;
  name: string;
}

export class JiraService {
  private axiosInstance: AxiosInstance;
  private jiraUrl: string;

  constructor(config: JiraConfig) {
    this.jiraUrl = config.jiraUrl;
    
    const headers: any = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // Setup authentication based on type
    if (config.authType === 'OAUTH' && config.accessToken) {
      headers['Authorization'] = `Bearer ${config.accessToken}`;
    } else if (config.authType === 'API_TOKEN' && config.email && config.apiToken) {
      const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    this.axiosInstance = axios.create({
      baseURL: `${config.jiraUrl}/rest/api/3`,
      headers,
      timeout: 30000,
    });
  }

  /**
   * Get all Jira projects accessible to the user
   */
  async getProjects(): Promise<JiraProject[]> {
    try {
      const response = await this.axiosInstance.get('/project');
      return response.data;
    } catch (error: any) {
      throw new AppError(`Failed to fetch Jira projects: ${error.message}`, 500);
    }
  }

  /**
   * Get a specific Jira issue by key
   */
  async getIssue(issueKey: string): Promise<JiraIssue> {
    try {
      const response = await this.axiosInstance.get(`/issue/${issueKey}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new AppError(`Jira issue ${issueKey} not found`, 404);
      }
      throw new AppError(`Failed to fetch Jira issue: ${error.message}`, 500);
    }
  }

  /**
   * Search Jira issues using JQL
   */
  async searchIssues(jql: string, maxResults: number = 50): Promise<JiraIssue[]> {
    try {
      const response = await this.axiosInstance.post('/search', {
        jql,
        maxResults,
        fields: ['summary', 'status', 'issuetype', 'description', 'project'],
      });
      return response.data.issues;
    } catch (error: any) {
      throw new AppError(`Failed to search Jira issues: ${error.message}`, 500);
    }
  }

  /**
   * Create a new Jira issue
   */
  async createIssue(data: {
    projectKey: string;
    summary: string;
    description?: string;
    issueType: string;
    parentKey?: string; // For subtasks or stories under epics
  }): Promise<JiraIssue> {
    try {
      const issueData: any = {
        fields: {
          project: {
            key: data.projectKey,
          },
          summary: data.summary,
          issuetype: {
            name: data.issueType,
          },
        },
      };

      if (data.description) {
        issueData.fields.description = {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: data.description,
                },
              ],
            },
          ],
        };
      }

      // Link to parent epic if provided
      if (data.parentKey) {
        issueData.fields.parent = {
          key: data.parentKey,
        };
      }

      const response = await this.axiosInstance.post('/issue', issueData);
      return await this.getIssue(response.data.key);
    } catch (error: any) {
      throw new AppError(`Failed to create Jira issue: ${error.message}`, 500);
    }
  }

  /**
   * Update a Jira issue
   */
  async updateIssue(
    issueKey: string,
    updates: {
      summary?: string;
      description?: string;
      status?: string;
    }
  ): Promise<void> {
    try {
      const fields: any = {};

      if (updates.summary) {
        fields.summary = updates.summary;
      }

      if (updates.description) {
        fields.description = {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: updates.description,
                },
              ],
            },
          ],
        };
      }

      if (Object.keys(fields).length > 0) {
        await this.axiosInstance.put(`/issue/${issueKey}`, { fields });
      }

      // Handle status transition separately
      if (updates.status) {
        await this.transitionIssue(issueKey, updates.status);
      }
    } catch (error: any) {
      throw new AppError(`Failed to update Jira issue: ${error.message}`, 500);
    }
  }

  /**
   * Transition issue to a different status
   */
  async transitionIssue(issueKey: string, targetStatus: string): Promise<void> {
    try {
      // Get available transitions
      const transitionsResponse = await this.axiosInstance.get(`/issue/${issueKey}/transitions`);
      const transitions = transitionsResponse.data.transitions;

      // Find transition that matches target status
      const transition = transitions.find(
        (t: any) => t.to.name.toLowerCase() === targetStatus.toLowerCase()
      );

      if (!transition) {
        throw new AppError(`Cannot transition to status: ${targetStatus}`, 400);
      }

      // Execute transition
      await this.axiosInstance.post(`/issue/${issueKey}/transitions`, {
        transition: {
          id: transition.id,
        },
      });
    } catch (error: any) {
      throw new AppError(`Failed to transition Jira issue: ${error.message}`, 500);
    }
  }

  /**
   * Add a comment to a Jira issue
   */
  async addComment(issueKey: string, comment: string): Promise<void> {
    try {
      await this.axiosInstance.post(`/issue/${issueKey}/comment`, {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: comment,
                },
              ],
            },
          ],
        },
      });
    } catch (error: any) {
      throw new AppError(`Failed to add comment to Jira issue: ${error.message}`, 500);
    }
  }

  /**
   * Get issue types for a project
   */
  async getIssueTypes(projectKey: string): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get(`/project/${projectKey}`);
      return response.data.issueTypes || [];
    } catch (error: any) {
      throw new AppError(`Failed to fetch issue types: ${error.message}`, 500);
    }
  }

  /**
   * Create a webhook for real-time updates
   */
  async createWebhook(webhookUrl: string, events: string[]): Promise<string> {
    try {
      const response = await this.axiosInstance.post('/webhook', {
        name: 'Qualix Integration Webhook',
        url: webhookUrl,
        events,
        filters: {},
      });
      return response.data.self;
    } catch (error: any) {
      throw new AppError(`Failed to create Jira webhook: ${error.message}`, 500);
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');
    return signature === expectedSignature;
  }
}

/**
 * Link a Qualix entity to a Jira issue
 */
export async function linkToJira(data: {
  jiraIntegrationId: string;
  jiraProjectId: string;
  jiraIssueKey: string;
  entityType: 'TEST_SUITE' | 'TEST_CASE' | 'TEST_PLAN' | 'DEFECT';
  entityId: string;
}) {
  try {
    // Get Jira integration to verify access
    const integration = await prisma.jiraIntegration.findUnique({
      where: { id: data.jiraIntegrationId },
    });

    if (!integration || !integration.isActive) {
      throw new AppError('Jira integration not found or inactive', 404);
    }

    // Create Jira service instance
    const jiraService = new JiraService({
      jiraUrl: integration.jiraUrl,
      authType: integration.authType as any,
      accessToken: integration.accessToken || undefined,
      apiToken: integration.apiToken || undefined,
      email: integration.email || undefined,
    });

    // Fetch Jira issue to get details
    const jiraIssue = await jiraService.getIssue(data.jiraIssueKey);

    // Create or update link
    const link = await prisma.jiraLink.upsert({
      where: {
        jiraIssueKey_entityType_entityId: {
          jiraIssueKey: data.jiraIssueKey,
          entityType: data.entityType,
          entityId: data.entityId,
        },
      },
      create: {
        jiraIntegrationId: data.jiraIntegrationId,
        jiraProjectId: data.jiraProjectId,
        jiraIssueKey: jiraIssue.key,
        jiraIssueId: jiraIssue.id,
        jiraIssueType: jiraIssue.fields.issuetype.name,
        jiraIssueSummary: jiraIssue.fields.summary,
        jiraIssueStatus: jiraIssue.fields.status.name,
        entityType: data.entityType,
        entityId: data.entityId,
        syncStatus: 'SYNCED',
        lastSyncedAt: new Date(),
      },
      update: {
        jiraIssueSummary: jiraIssue.fields.summary,
        jiraIssueStatus: jiraIssue.fields.status.name,
        lastSyncedAt: new Date(),
      },
    });

    return link;
  } catch (error: any) {
    throw new AppError(error.message, error.statusCode || 500);
  }
}

/**
 * Unlink a Qualix entity from a Jira issue
 */
export async function unlinkFromJira(
  jiraIssueKey: string,
  entityType: string,
  entityId: string
) {
  try {
    await prisma.jiraLink.delete({
      where: {
        jiraIssueKey_entityType_entityId: {
          jiraIssueKey,
          entityType: entityType as any,
          entityId,
        },
      },
    });
  } catch (error: any) {
    throw new AppError('Failed to unlink from Jira', 500);
  }
}

/**
 * Sync a specific entity to Jira
 */
export async function syncEntityToJira(
  entityType: 'TEST_SUITE' | 'TEST_CASE' | 'TEST_PLAN' | 'DEFECT',
  entityId: string
) {
  try {
    // Get existing link
    const link = await prisma.jiraLink.findFirst({
      where: {
        entityType,
        entityId,
      },
      include: {
        jiraIntegration: true,
      },
    });

    if (!link || link.syncDirection === 'FROM_JIRA') {
      return; // No link or sync disabled for this direction
    }

    const integration = link.jiraIntegration;
    const jiraService = new JiraService({
      jiraUrl: integration.jiraUrl,
      authType: integration.authType as any,
      accessToken: integration.accessToken || undefined,
      apiToken: integration.apiToken || undefined,
      email: integration.email || undefined,
    });

    // Get entity details based on type
    let entityName = '';
    let entityDescription = '';

    switch (entityType) {
      case 'TEST_SUITE':
        const testSuite = await prisma.testSuite.findUnique({
          where: { id: entityId },
        });
        entityName = testSuite?.name || '';
        entityDescription = testSuite?.description || '';
        break;
      case 'TEST_CASE':
        const testCase = await prisma.testCase.findUnique({
          where: { id: entityId },
        });
        entityName = testCase?.title || '';
        entityDescription = testCase?.description || '';
        break;
      case 'TEST_PLAN':
        const testPlan = await prisma.testPlan.findUnique({
          where: { id: entityId },
        });
        entityName = testPlan?.name || '';
        entityDescription = testPlan?.description || '';
        break;
      case 'DEFECT':
        const defect = await prisma.defect.findUnique({
          where: { id: entityId },
        });
        entityName = defect?.title || '';
        entityDescription = defect?.description || '';
        break;
    }

    // Update Jira issue
    await jiraService.updateIssue(link.jiraIssueKey, {
      summary: entityName,
      description: entityDescription,
    });

    // Update sync status
    await prisma.jiraLink.update({
      where: { id: link.id },
      data: {
        syncStatus: 'SYNCED',
        lastSyncedAt: new Date(),
      },
    });
  } catch (error: any) {
    // Mark sync as failed
    const link = await prisma.jiraLink.findFirst({
      where: { entityType, entityId },
    });
    if (link) {
      await prisma.jiraLink.update({
        where: { id: link.id },
        data: { syncStatus: 'FAILED' },
      });
    }
    throw new AppError(`Failed to sync to Jira: ${error.message}`, 500);
  }
}

/**
 * Sync from Jira to Qualix entity
 */
export async function syncFromJira(jiraIssueKey: string) {
  try {
    // Get link
    const link = await prisma.jiraLink.findFirst({
      where: { jiraIssueKey },
      include: { jiraIntegration: true },
    });

    if (!link || link.syncDirection === 'TO_JIRA') {
      return;
    }

    const integration = link.jiraIntegration;
    const jiraService = new JiraService({
      jiraUrl: integration.jiraUrl,
      authType: integration.authType as any,
      accessToken: integration.accessToken || undefined,
      apiToken: integration.apiToken || undefined,
      email: integration.email || undefined,
    });

    // Fetch latest issue data
    const jiraIssue = await jiraService.getIssue(jiraIssueKey);

    // Update link metadata
    await prisma.jiraLink.update({
      where: { id: link.id },
      data: {
        jiraIssueSummary: jiraIssue.fields.summary,
        jiraIssueStatus: jiraIssue.fields.status.name,
        lastSyncedAt: new Date(),
      },
    });

    // Update entity based on type (if bidirectional)
    if (link.syncDirection === 'BIDIRECTIONAL') {
      const description = jiraIssue.fields.description || '';
      
      switch (link.entityType) {
        case 'TEST_SUITE':
          await prisma.testSuite.update({
            where: { id: link.entityId },
            data: {
              name: jiraIssue.fields.summary,
              description,
            },
          });
          break;
        case 'TEST_CASE':
          await prisma.testCase.update({
            where: { id: link.entityId },
            data: {
              title: jiraIssue.fields.summary,
              description,
            },
          });
          break;
        case 'TEST_PLAN':
          await prisma.testPlan.update({
            where: { id: link.entityId },
            data: {
              name: jiraIssue.fields.summary,
              description,
            },
          });
          break;
        case 'DEFECT':
          await prisma.defect.update({
            where: { id: link.entityId },
            data: {
              title: jiraIssue.fields.summary,
              description,
            },
          });
          break;
      }
    }
  } catch (error: any) {
    throw new AppError(`Failed to sync from Jira: ${error.message}`, 500);
  }
}

export default JiraService;
