import axios, { AxiosInstance, AxiosError } from 'axios';
import { AppError } from '../middleware/error.middleware';

/**
 * Jira Connection Validator
 * Detects Jira type, validates credentials, and provides detailed error messages
 */

export interface JiraConnectionConfig {
  jiraUrl: string;
  email?: string;
  apiToken?: string;
  username?: string;
  password?: string;
  accessToken?: string;
}

export interface JiraConnectionResult {
  success: boolean;
  jiraType: 'CLOUD' | 'SERVER' | 'DATACENTER' | 'UNKNOWN';
  apiVersion: string;
  currentUser?: {
    accountId?: string;
    displayName: string;
    emailAddress?: string;
  };
  accessibleProjects?: number;
  error?: {
    code: string;
    message: string;
    details: string;
    solution: string;
  };
}

export class JiraConnectionValidator {
  private baseUrl: string;
  private rawUrl: string;

  constructor(jiraUrl: string) {
    this.rawUrl = jiraUrl;
    this.baseUrl = this.normalizeUrl(jiraUrl);
  }

  /**
   * Normalize and validate Jira URL
   */
  private normalizeUrl(url: string): string {
    try {
      // Remove trailing slashes
      let normalized = url.trim().replace(/\/+$/, '');

      // Check if this is an OAuth redirect URL and extract the actual Jira URL
      if (normalized.includes('?continue=') || normalized.includes('&continue=')) {
        const continueMatch = normalized.match(/continue=([^&]+)/);
        if (continueMatch) {
          const decoded = decodeURIComponent(continueMatch[1]);
          // Extract the base domain from the decoded URL
          const urlMatch = decoded.match(/https?:\/\/([^\/]+)/);
          if (urlMatch) {
            normalized = `https://${urlMatch[1]}`;
          }
        }
      }

      // Extract Jira domain from OAuth URLs like "atlassian.net?continue=..."
      if (normalized.includes('atlassian.net') && !normalized.startsWith('http')) {
        const domainMatch = normalized.match(/([a-zA-Z0-9-]+)\.atlassian\.net/);
        if (domainMatch) {
          normalized = `https://${domainMatch[0]}`;
        } else {
          throw new Error('Could not extract Jira domain from URL. Please use format: https://yourcompany.atlassian.net');
        }
      }

      // Add https:// if missing
      if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
        normalized = `https://${normalized}`;
      }

      // Validate URL format
      const urlObj = new URL(normalized);
      
      // Check for common mistakes
      if (urlObj.hostname === 'jira.atlassian.com') {
        throw new Error('Invalid URL: jira.atlassian.com is not a valid Jira instance. Use your company subdomain (e.g., yourcompany.atlassian.net)');
      }

      // Check if it's just "atlassian.net" without subdomain
      if (urlObj.hostname === 'atlassian.net') {
        throw new Error('Invalid URL: Please include your company subdomain (e.g., https://yourcompany.atlassian.net, not https://atlassian.net)');
      }

      // Additional validation for Atlassian Cloud URLs
      if (urlObj.hostname.endsWith('.atlassian.net')) {
        const subdomain = urlObj.hostname.split('.')[0];
        if (!subdomain || subdomain.length < 2) {
          throw new Error('Invalid URL: Subdomain is too short. Use format: https://yourcompany.atlassian.net');
        }
      }

      return normalized;
    } catch (error: any) {
      if (error.message.startsWith('Invalid URL:')) {
        throw new AppError(error.message, 400);
      }
      throw new AppError(`Invalid Jira URL format: ${error.message}. Expected format: https://yourcompany.atlassian.net or https://jira.yourcompany.com`, 400);
    }
  }

  /**
   * Detect Jira type from URL and server info
   */
  private detectJiraType(url: string, serverInfo?: any): 'CLOUD' | 'SERVER' | 'DATACENTER' | 'UNKNOWN' {
    // Cloud detection
    if (url.includes('.atlassian.net') || url.includes('.jira.com')) {
      return 'CLOUD';
    }

    // Server/Data Center detection from server info
    if (serverInfo) {
      const deploymentType = serverInfo.deploymentType?.toLowerCase();
      if (deploymentType === 'cloud') return 'CLOUD';
      if (deploymentType === 'server') return 'SERVER';
      if (deploymentType === 'datacenter') return 'DATACENTER';
    }

    // Default to SERVER for self-hosted
    if (url.includes('localhost') || url.match(/\d+\.\d+\.\d+\.\d+/)) {
      return 'SERVER';
    }

    return 'UNKNOWN';
  }

  /**
   * Build authentication header
   */
  private buildAuthHeader(config: JiraConnectionConfig): string {
    if (config.accessToken) {
      return `Bearer ${config.accessToken}`;
    }

    if (config.email && config.apiToken) {
      const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
      return `Basic ${auth}`;
    }

    if (config.username && config.password) {
      const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      return `Basic ${auth}`;
    }

    throw new AppError('No valid authentication credentials provided', 400);
  }

  /**
   * Test connection and return detailed result
   */
  async testConnection(config: JiraConnectionConfig): Promise<JiraConnectionResult> {
    try {
      // Step 1: Validate URL reachability
      const urlCheckResult = await this.validateUrlReachability();
      if (!urlCheckResult.success) {
        return urlCheckResult;
      }

      // Step 2: Detect Jira type and API version
      const jiraType = this.detectJiraType(this.baseUrl);
      const apiVersion = jiraType === 'CLOUD' ? '3' : '2';

      // Step 3: Create axios instance with auth
      const authHeader = this.buildAuthHeader(config);
      const axiosInstance = axios.create({
        baseURL: `${this.baseUrl}/rest/api/${apiVersion}`,
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 15000,
        validateStatus: (status) => status < 500, // Don't throw on 4xx
      });

      // Step 4: Get server info
      let serverInfo;
      try {
        const serverResponse = await axios.get(`${this.baseUrl}/rest/api/${apiVersion}/serverInfo`, {
          headers: {
            'Accept': 'application/json',
          },
          timeout: 10000,
        });
        serverInfo = serverResponse.data;
      } catch (error) {
        // Server info might not be accessible without auth, that's okay
      }

      const detectedJiraType = this.detectJiraType(this.baseUrl, serverInfo);

      // Step 5: Validate authentication by getting current user
      const userResponse = await axiosInstance.get('/myself');
      
      if (userResponse.status === 401) {
        return this.handleAuthError(config, detectedJiraType);
      }

      if (userResponse.status === 403) {
        return {
          success: false,
          jiraType: detectedJiraType,
          apiVersion,
          error: {
            code: 'FORBIDDEN',
            message: 'Authentication succeeded but access denied',
            details: 'Valid credentials but insufficient permissions',
            solution: 'Ensure the Jira user has "Browse Projects" permission and access to at least one project.',
          },
        };
      }

      if (userResponse.status !== 200) {
        return {
          success: false,
          jiraType: detectedJiraType,
          apiVersion,
          error: {
            code: 'UNEXPECTED_ERROR',
            message: `Unexpected response: ${userResponse.status}`,
            details: userResponse.data?.errorMessages?.join(', ') || 'Unknown error',
            solution: 'Check Jira server logs or contact Jira administrator.',
          },
        };
      }

      const currentUser = userResponse.data;

      // Step 6: Check project access
      const projectsResponse = await axiosInstance.get('/project');
      const accessibleProjects = projectsResponse.data?.length || 0;

      if (accessibleProjects === 0) {
        return {
          success: false,
          jiraType: detectedJiraType,
          apiVersion,
          currentUser: {
            accountId: currentUser.accountId,
            displayName: currentUser.displayName,
            emailAddress: currentUser.emailAddress,
          },
          error: {
            code: 'NO_PROJECTS',
            message: 'Connection successful but no accessible projects',
            details: 'User authenticated successfully but cannot access any Jira projects',
            solution: 'Grant the user access to at least one Jira project or check project permissions.',
          },
        };
      }

      // Success!
      return {
        success: true,
        jiraType: detectedJiraType,
        apiVersion,
        currentUser: {
          accountId: currentUser.accountId,
          displayName: currentUser.displayName,
          emailAddress: currentUser.emailAddress,
        },
        accessibleProjects,
      };

    } catch (error: any) {
      return this.handleGenericError(error, config);
    }
  }

  /**
   * Validate URL is reachable
   */
  private async validateUrlReachability(): Promise<JiraConnectionResult> {
    try {
      const response = await axios.get(this.baseUrl, {
        timeout: 10000,
        validateStatus: () => true, // Accept any status
        maxRedirects: 5,
      });

      // If we get any response, URL is reachable
      if (response.status) {
        return { success: true, jiraType: 'UNKNOWN', apiVersion: '2' };
      }

      return {
        success: false,
        jiraType: 'UNKNOWN',
        apiVersion: '2',
        error: {
          code: 'URL_UNREACHABLE',
          message: 'Cannot reach Jira URL',
          details: 'The provided URL did not respond',
          solution: 'Check that the URL is correct and the Jira server is accessible from this network.',
        },
      };
    } catch (error: any) {
      if (error.code === 'ENOTFOUND') {
        return {
          success: false,
          jiraType: 'UNKNOWN',
          apiVersion: '2',
          error: {
            code: 'DNS_ERROR',
            message: 'Domain name not found',
            details: `Cannot resolve domain: ${this.rawUrl}`,
            solution: 'Check the Jira URL spelling. For Cloud, it should be https://yourcompany.atlassian.net',
          },
        };
      }

      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          jiraType: 'UNKNOWN',
          apiVersion: '2',
          error: {
            code: 'CONNECTION_REFUSED',
            message: 'Connection refused',
            details: 'Jira server refused the connection',
            solution: 'Check that Jira is running and accessible. Verify firewall settings and port configuration.',
          },
        };
      }

      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        return {
          success: false,
          jiraType: 'UNKNOWN',
          apiVersion: '2',
          error: {
            code: 'TIMEOUT',
            message: 'Connection timeout',
            details: 'Request timed out before reaching Jira server',
            solution: 'Check network connectivity and firewall settings. The Jira server might be slow or unreachable.',
          },
        };
      }

      // URL is reachable even if there's an error (e.g., 404, 500)
      return { success: true, jiraType: 'UNKNOWN', apiVersion: '2' };
    }
  }

  /**
   * Handle authentication-specific errors
   */
  private handleAuthError(config: JiraConnectionConfig, jiraType: string): JiraConnectionResult {
    // Detect likely causes
    if (jiraType === 'CLOUD' && config.username && config.password) {
      return {
        success: false,
        jiraType: jiraType as any,
        apiVersion: '3',
        error: {
          code: 'WRONG_AUTH_METHOD_CLOUD',
          message: 'Invalid authentication for Jira Cloud',
          details: 'Jira Cloud does not accept username/password authentication',
          solution: 'Use Email + API Token instead. Generate an API token at: https://id.atlassian.com/manage-profile/security/api-tokens',
        },
      };
    }

    if (jiraType === 'SERVER' && config.email && config.apiToken) {
      return {
        success: false,
        jiraType: jiraType as any,
        apiVersion: '2',
        error: {
          code: 'WRONG_AUTH_METHOD_SERVER',
          message: 'Invalid authentication for Jira Server',
          details: 'This appears to be Jira Server/Data Center, not Cloud',
          solution: 'Jira Server typically uses username/password or Personal Access Tokens (PAT), not Cloud API tokens.',
        },
      };
    }

    if (config.email && config.apiToken) {
      return {
        success: false,
        jiraType: jiraType as any,
        apiVersion: jiraType === 'CLOUD' ? '3' : '2',
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Authentication failed: Invalid email or API token',
          details: 'The provided credentials were rejected by Jira',
          solution: 'Verify:\n1. Email address matches your Atlassian account\n2. API token is correct and not expired\n3. Generate a new token at: https://id.atlassian.com/manage-profile/security/api-tokens',
        },
      };
    }

    return {
      success: false,
      jiraType: jiraType as any,
      apiVersion: jiraType === 'CLOUD' ? '3' : '2',
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Authentication failed',
        details: 'Invalid credentials provided',
        solution: 'Check your authentication credentials and try again.',
      },
    };
  }

  /**
   * Handle generic errors
   */
  private handleGenericError(error: any, config: JiraConnectionConfig): JiraConnectionResult {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      const status = axiosError.response.status;
      const data: any = axiosError.response.data;

      if (status === 404) {
        return {
          success: false,
          jiraType: 'UNKNOWN',
          apiVersion: '2',
          error: {
            code: 'API_NOT_FOUND',
            message: 'Jira API endpoint not found',
            details: 'The REST API endpoint returned 404',
            solution: 'This might be an incorrect API version. Try switching between Cloud (API v3) and Server (API v2) modes.',
          },
        };
      }

      if (status === 405) {
        return {
          success: false,
          jiraType: 'UNKNOWN',
          apiVersion: '2',
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: 'HTTP method not allowed',
            details: 'The Jira endpoint does not support this request method',
            solution: 'This might indicate an incorrect Jira URL or API version mismatch.',
          },
        };
      }

      return {
        success: false,
        jiraType: 'UNKNOWN',
        apiVersion: '2',
        error: {
          code: 'HTTP_ERROR',
          message: `HTTP ${status} error`,
          details: data?.errorMessages?.join(', ') || data?.message || 'Unknown error',
          solution: 'Check Jira server logs for more details.',
        },
      };
    }

    return {
      success: false,
      jiraType: 'UNKNOWN',
      apiVersion: '2',
      error: {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Unknown connection error',
        details: error.toString(),
        solution: 'Check network connectivity and Jira availability. Contact support if the issue persists.',
      },
    };
  }
}

export default JiraConnectionValidator;
