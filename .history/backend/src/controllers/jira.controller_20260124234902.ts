import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import JiraService, {
  linkToJira,
  unlinkFromJira,
  syncEntityToJira,
  syncFromJira,
} from '../services/jira.service';
import { JiraConnectionValidator } from '../services/jira.validator.service';

const prisma = new PrismaClient();

/**
 * Test Jira connection without saving
 */
export const testJiraConnection = async (req: Request, res: Response) => {
  try {
    const { jiraUrl, email, apiToken, username, password, accessToken } = req.body;

    if (!jiraUrl) {
      throw new AppError('jiraUrl is required', 400);
    }

    const validator = new JiraConnectionValidator(jiraUrl);
    const result = await validator.testConnection({
      jiraUrl,
      email,
      apiToken,
      username,
      password,
      accessToken,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        jiraType: result.jiraType,
        apiVersion: result.apiVersion,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Connection successful',
      data: {
        jiraType: result.jiraType,
        apiVersion: result.apiVersion,
        currentUser: result.currentUser,
        accessibleProjects: result.accessibleProjects,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error.toString(),
        solution: 'Check the request parameters and try again.',
      },
    });
  }
};

/**
 * Setup Jira integration for a project
 */
export const setupJiraIntegration = async (req: Request, res: Response) => {
  try {
    const { testProjectId } = req.params;
    const { jiraUrl, authType, accessToken, apiToken, email } = req.body;

    // Validate required fields
    if (!jiraUrl || !authType) {
      throw new AppError('jiraUrl and authType are required', 400);
    }

    if (authType === 'API_TOKEN' && (!apiToken || !email)) {
      throw new AppError('apiToken and email are required for API_TOKEN auth', 400);
    }

    if (authType === 'OAUTH' && !accessToken) {
      throw new AppError('accessToken is required for OAUTH auth', 400);
    }

    // Test connection first with detailed validation
    const validator = new JiraConnectionValidator(jiraUrl);
    const connectionResult = await validator.testConnection({
      jiraUrl,
      email,
      apiToken,
      accessToken,
    });

    if (!connectionResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to connect to Jira',
        error: connectionResult.error,
        jiraType: connectionResult.jiraType,
      });
    }

    // Connection successful - create or update integration
    const integration = await prisma.jiraIntegration.upsert({
      where: { testProjectId },
      create: {
        testProjectId,
        jiraUrl,
        authType,
        accessToken,
        apiToken,
        email,
        isActive: true,
        syncEnabled: true,
      },
      update: {
        jiraUrl,
        authType,
        accessToken,
        apiToken,
        email,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Jira integration configured successfully',
      data: {
        id: integration.id,
        jiraUrl: integration.jiraUrl,
        authType: integration.authType,
        isActive: integration.isActive,
        jiraType: connectionResult.jiraType,
        currentUser: connectionResult.currentUser,
        accessibleProjects: connectionResult.accessibleProjects,
      },
    });
  } catch (error: any) {
    throw new AppError(error.message, error.statusCode || 500);
  }
};

/**
 * Get Jira integration settings
 */
export const getJiraIntegration = async (req: Request, res: Response) => {
  try {
    const { testProjectId } = req.params;

    const integration = await prisma.jiraIntegration.findUnique({
      where: { testProjectId },
      include: {
        jiraProjects: true,
      },
    });

    if (!integration) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: integration.id,
        jiraUrl: integration.jiraUrl,
        authType: integration.authType,
        email: integration.email,
        isActive: integration.isActive,
        syncEnabled: integration.syncEnabled,
        lastSyncAt: integration.lastSyncAt,
        jiraProjects: integration.jiraProjects,
      },
    });
  } catch (error: any) {
    throw new AppError(error.message, error.statusCode || 500);
  }
};

/**
 * Disable/enable Jira integration
 */
export const toggleJiraIntegration = async (req: Request, res: Response) => {
  try {
    const { testProjectId } = req.params;
    const { isActive } = req.body;

    const integration = await prisma.jiraIntegration.update({
      where: { testProjectId },
      data: { isActive },
    });

    res.status(200).json({
      success: true,
      message: `Jira integration ${isActive ? 'enabled' : 'disabled'}`,
      data: integration,
    });
  } catch (error: any) {
    throw new AppError(error.message, error.statusCode || 500);
  }
};

/**
 * Get Jira projects
 */
export const getJiraProjects = async (req: Request, res: Response) => {
  try {
    const { testProjectId } = req.params;

    const integration = await prisma.jiraIntegration.findUnique({
      where: { testProjectId },
    });

    if (!integration || !integration.isActive) {
      throw new AppError('Jira integration not found or inactive', 404);
    }

    const jiraService = new JiraService({
      jiraUrl: integration.jiraUrl,
      authType: integration.authType as any,
      accessToken: integration.accessToken || undefined,
      apiToken: integration.apiToken || undefined,
      email: integration.email || undefined,
    });

    const projects = await jiraService.getProjects();

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error: any) {
    throw new AppError(error.message, error.statusCode || 500);
  }
};

/**
 * Map Jira project to sync
 */
export const mapJiraProject = async (req: Request, res: Response) => {
  try {
    const { testProjectId } = req.params;
    const { jiraProjectKey, jiraProjectId, jiraProjectName, issueTypeMapping } = req.body;

    const integration = await prisma.jiraIntegration.findUnique({
      where: { testProjectId },
    });

    if (!integration) {
      throw new AppError('Jira integration not found', 404);
    }

    const jiraProject = await prisma.jiraProject.create({
      data: {
        jiraIntegrationId: integration.id,
        jiraProjectKey,
        jiraProjectId,
        jiraProjectName,
        issueTypeMapping: issueTypeMapping || {},
        syncEnabled: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Jira project mapped successfully',
      data: jiraProject,
    });
  } catch (error: any) {
    throw new AppError(error.message, error.statusCode || 500);
  }
};

/**
 * Search Jira issues
 */
export const searchJiraIssues = async (req: Request, res: Response) => {
  try {
    const { testProjectId } = req.params;
    const { jql, maxResults } = req.query;

    const integration = await prisma.jiraIntegration.findUnique({
      where: { testProjectId },
    });

    if (!integration || !integration.isActive) {
      throw new AppError('Jira integration not found or inactive', 404);
    }

    const jiraService = new JiraService({
      jiraUrl: integration.jiraUrl,
      authType: integration.authType as any,
      accessToken: integration.accessToken || undefined,
      apiToken: integration.apiToken || undefined,
      email: integration.email || undefined,
    });

    const issues = await jiraService.searchIssues(
      (jql as string) || '',
      maxResults ? parseInt(maxResults as string) : 50
    );

    res.status(200).json({
      success: true,
      data: issues,
    });
  } catch (error: any) {
    throw new AppError(error.message, error.statusCode || 500);
  }
};

/**
 * Link entity to Jira issue
 */
export const linkEntityToJira = async (req: Request, res: Response) => {
  try {
    const { jiraIssueKey, entityType, entityId, jiraProjectId } = req.body;
    const { testProjectId } = req.params;

    const integration = await prisma.jiraIntegration.findUnique({
      where: { testProjectId },
    });

    if (!integration) {
      throw new AppError('Jira integration not found', 404);
    }

    const link = await linkToJira({
      jiraIntegrationId: integration.id,
      jiraProjectId,
      jiraIssueKey,
      entityType,
      entityId,
    });

    res.status(201).json({
      success: true,
      message: 'Entity linked to Jira successfully',
      data: link,
    });
  } catch (error: any) {
    throw new AppError(error.message, error.statusCode || 500);
  }
};

/**
 * Unlink entity from Jira
 */
export const unlinkEntityFromJira = async (req: Request, res: Response) => {
  try {
    const { jiraIssueKey, entityType, entityId } = req.body;

    await unlinkFromJira(jiraIssueKey, entityType, entityId);

    res.status(200).json({
      success: true,
      message: 'Entity unlinked from Jira successfully',
    });
  } catch (error: any) {
    throw new AppError(error.message, error.statusCode || 500);
  }
};

/**
 * Get Jira links for an entity
 */
export const getEntityJiraLinks = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;

    const links = await prisma.jiraLink.findMany({
      where: {
        entityType: entityType as any,
        entityId,
      },
      include: {
        jiraProject: true,
      },
    });

    res.status(200).json({
      success: true,
      data: links,
    });
  } catch (error: any) {
    throw new AppError(error.message, error.statusCode || 500);
  }
};

/**
 * Sync entity to Jira
 */
export const syncEntityToJiraHandler = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.body;

    await syncEntityToJira(entityType, entityId);

    res.status(200).json({
      success: true,
      message: 'Entity synced to Jira successfully',
    });
  } catch (error: any) {
    throw new AppError(error.message, error.statusCode || 500);
  }
};

/**
 * Sync from Jira
 */
export const syncFromJiraHandler = async (req: Request, res: Response) => {
  try {
    const { jiraIssueKey } = req.body;

    await syncFromJira(jiraIssueKey);

    res.status(200).json({
      success: true,
      message: 'Synced from Jira successfully',
    });
  } catch (error: any) {
    throw new AppError(error.message, error.statusCode || 500);
  }
};

/**
 * Handle Jira webhook
 */
export const handleJiraWebhook = async (req: Request, res: Response) => {
  try {
    const { testProjectId } = req.params;
    const webhookEvent = req.body;

    // Get integration
    const integration = await prisma.jiraIntegration.findUnique({
      where: { testProjectId },
    });

    if (!integration) {
      throw new AppError('Jira integration not found', 404);
    }

    // Verify webhook signature if secret is configured
    // const signature = req.headers['x-hub-signature'] as string;
    // if (integration.webhookSecret && signature) {
    //   const isValid = JiraService.verifyWebhookSignature(
    //     JSON.stringify(req.body),
    //     signature,
    //     integration.webhookSecret
    //   );
    //   if (!isValid) {
    //     throw new AppError('Invalid webhook signature', 401);
    //   }
    // }

    // Log webhook event
    await prisma.jiraWebhookEvent.create({
      data: {
        jiraIntegrationId: integration.id,
        eventType: webhookEvent.webhookEvent,
        issueKey: webhookEvent.issue?.key || '',
        issueId: webhookEvent.issue?.id || '',
        payload: webhookEvent,
        processed: false,
      },
    });

    // Process event asynchronously
    processJiraWebhookEvent(integration.id, webhookEvent).catch((error) => {
      console.error('Failed to process webhook:', error);
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    throw new AppError(error.message, error.statusCode || 500);
  }
};

/**
 * Process Jira webhook event (async)
 */
async function processJiraWebhookEvent(jiraIntegrationId: string, event: any) {
  try {
    const eventType = event.webhookEvent;
    const issueKey = event.issue?.key;

    if (!issueKey) return;

    // Handle different event types
    switch (eventType) {
      case 'jira:issue_updated':
      case 'jira:issue_created':
        await syncFromJira(issueKey);
        break;
      case 'jira:issue_deleted':
        // Remove links
        await prisma.jiraLink.deleteMany({
          where: {
            jiraIntegrationId,
            jiraIssueKey: issueKey,
          },
        });
        break;
    }

    // Mark event as processed
    await prisma.jiraWebhookEvent.updateMany({
      where: {
        jiraIntegrationId,
        issueKey,
        processed: false,
      },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });
  } catch (error: any) {
    // Mark event as failed
    await prisma.jiraWebhookEvent.updateMany({
      where: {
        jiraIntegrationId,
        issueKey: event.issue?.key,
        processed: false,
      },
      data: {
        processed: true,
        processedAt: new Date(),
        error: error.message,
      },
    });
  }
}

/**
 * Get issue types for a Jira project
 */
export const getJiraIssueTypes = async (req: Request, res: Response) => {
  try {
    const { testProjectId, projectKey } = req.params;

    const integration = await prisma.jiraIntegration.findUnique({
      where: { testProjectId },
    });

    if (!integration || !integration.isActive) {
      throw new AppError('Jira integration not found or inactive', 404);
    }

    const jiraService = new JiraService({
      jiraUrl: integration.jiraUrl,
      authType: integration.authType as any,
      accessToken: integration.accessToken || undefined,
      apiToken: integration.apiToken || undefined,
      email: integration.email || undefined,
    });

    const issueTypes = await jiraService.getIssueTypes(projectKey);

    res.status(200).json({
      success: true,
      data: issueTypes,
    });
  } catch (error: any) {
    throw new AppError(error.message, error.statusCode || 500);
  }
};
