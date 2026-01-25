import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

interface CreatePipelineRequest {
  testProjectId: string;
  name: string;
  provider: string;
  pipelineUrl?: string;
  config: any;
}

interface TriggerPipelineRequest {
  pipelineId: string;
  branchName?: string;
  commitHash?: string;
  triggeredBy: string;
  parameters?: Record<string, any>;
}

interface ReportTestResultsRequest {
  pipelineId: string;
  runNumber: number;
  results: Array<{
    testName: string;
    testCaseId?: string;
    status: string;
    duration?: number;
    errorMessage?: string;
    stackTrace?: string;
  }>;
}

export class CICDService {
  /**
   * Create a new CI/CD pipeline configuration
   */
  async createPipeline(data: CreatePipelineRequest) {
    const pipeline = await prisma.cICDPipeline.create({
      data: {
        testProjectId: data.testProjectId,
        name: data.name,
        provider: data.provider as any,
        pipelineUrl: data.pipelineUrl,
        config: data.config,
        isActive: true,
      },
    });

    return pipeline;
  }

  /**
   * List all pipelines for a project
   */
  async listPipelines(testProjectId: string) {
    return await prisma.cICDPipeline.findMany({
      where: { testProjectId },
      include: {
        runs: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Get pipeline details
   */
  async getPipeline(pipelineId: string) {
    const pipeline = await prisma.cICDPipeline.findUnique({
      where: { id: pipelineId },
      include: {
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!pipeline) {
      throw new Error('Pipeline not found');
    }

    return pipeline;
  }

  /**
   * Trigger a pipeline run
   */
  async triggerPipeline(data: TriggerPipelineRequest) {
    const pipeline = await prisma.cICDPipeline.findUnique({
      where: { id: data.pipelineId },
    });

    if (!pipeline) {
      throw new Error('Pipeline not found');
    }

    if (!pipeline.isActive) {
      throw new Error('Pipeline is not active');
    }

    // Get the next run number
    const lastRun = await prisma.cICDRun.findFirst({
      where: { pipelineId: data.pipelineId },
      orderBy: { runNumber: 'desc' },
    });

    const runNumber = (lastRun?.runNumber || 0) + 1;

    // Create the run
    const run = await prisma.cICDRun.create({
      data: {
        pipelineId: data.pipelineId,
        runNumber,
        status: 'PENDING',
        triggeredBy: data.triggeredBy,
        branchName: data.branchName,
        commitHash: data.commitHash,
        metadata: data.parameters || {},
      },
    });

    // Actually trigger the pipeline in the CI/CD system
    try {
      await this.triggerExternalPipeline(pipeline, data);

      await prisma.cICDRun.update({
        where: { id: run.id },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
        },
      });
    } catch (error) {
      await prisma.cICDRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILURE',
          logs: `Failed to trigger pipeline: ${error}`,
        },
      });
      throw error;
    }

    return run;
  }

  /**
   * Report test results from CI/CD run
   */
  async reportTestResults(data: ReportTestResultsRequest) {
    const run = await prisma.cICDRun.findFirst({
      where: {
        pipelineId: data.pipelineId,
        runNumber: data.runNumber,
      },
    });

    if (!run) {
      throw new Error('CI/CD run not found');
    }

    // Create test result records
    const results = await Promise.all(
      data.results.map((result) =>
        prisma.cICDTestResult.create({
          data: {
            cicdRunId: run.id,
            testCaseId: result.testCaseId,
            testName: result.testName,
            status: result.status as any,
            duration: result.duration,
            errorMessage: result.errorMessage,
            stackTrace: result.stackTrace,
          },
        })
      )
    );

    // Calculate run statistics
    const totalTests = results.length;
    const passedTests = results.filter((r) => r.status === 'PASSED').length;
    const failedTests = results.filter((r) => r.status === 'FAILED').length;
    const skippedTests = results.filter((r) => r.status === 'SKIPPED').length;

    const runStatus =
      failedTests > 0
        ? 'FAILURE'
        : skippedTests === totalTests
        ? 'SKIPPED'
        : 'SUCCESS';

    // Update run with completion info
    await prisma.cICDRun.update({
      where: { id: run.id },
      data: {
        status: runStatus,
        completedAt: new Date(),
        duration: Math.floor(
          (new Date().getTime() - (run.startedAt?.getTime() || new Date().getTime())) / 1000
        ),
      },
    });

    // Update flaky test detection if applicable
    await this.updateFlakyDetection(results);

    return {
      run,
      results,
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        skipped: skippedTests,
        passRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
      },
    };
  }

  /**
   * Get CI/CD run details
   */
  async getRun(runId: string) {
    const run = await prisma.cICDRun.findUnique({
      where: { id: runId },
      include: {
        pipeline: true,
        testResults: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!run) {
      throw new Error('CI/CD run not found');
    }

    return run;
  }

  /**
   * Get CI/CD run statistics for a project
   */
  async getRunStatistics(testProjectId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const runs = await prisma.cICDRun.findMany({
      where: {
        pipeline: {
          testProjectId,
        },
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        testResults: true,
        pipeline: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const statistics = {
      totalRuns: runs.length,
      successfulRuns: runs.filter((r) => r.status === 'SUCCESS').length,
      failedRuns: runs.filter((r) => r.status === 'FAILURE').length,
      averageDuration: 0,
      trends: [] as any[],
      byPipeline: {} as Record<string, any>,
    };

    // Calculate average duration
    const completedRuns = runs.filter((r) => r.duration);
    if (completedRuns.length > 0) {
      statistics.averageDuration =
        completedRuns.reduce((sum, r) => sum + (r.duration || 0), 0) /
        completedRuns.length;
    }

    // Group by pipeline
    runs.forEach((run) => {
      const pipelineName = run.pipeline.name;
      if (!statistics.byPipeline[pipelineName]) {
        statistics.byPipeline[pipelineName] = {
          total: 0,
          success: 0,
          failed: 0,
          avgDuration: 0,
        };
      }

      statistics.byPipeline[pipelineName].total++;
      if (run.status === 'SUCCESS')
        statistics.byPipeline[pipelineName].success++;
      if (run.status === 'FAILURE') statistics.byPipeline[pipelineName].failed++;
    });

    return statistics;
  }

  /**
   * Sync with external CI/CD system
   */
  async syncWithExternal(pipelineId: string) {
    const pipeline = await prisma.cICDPipeline.findUnique({
      where: { id: pipelineId },
    });

    if (!pipeline) {
      throw new Error('Pipeline not found');
    }

    try {
      const externalRuns = await this.fetchExternalRuns(pipeline);

      // Sync runs that don't exist locally
      for (const externalRun of externalRuns) {
        const existingRun = await prisma.cICDRun.findFirst({
          where: {
            pipelineId: pipeline.id,
            runNumber: externalRun.runNumber,
          },
        });

        if (!existingRun) {
          await prisma.cICDRun.create({
            data: {
              pipelineId: pipeline.id,
              runNumber: externalRun.runNumber,
              status: externalRun.status,
              startedAt: externalRun.startedAt,
              completedAt: externalRun.completedAt,
              duration: externalRun.duration,
              triggeredBy: externalRun.triggeredBy,
              commitHash: externalRun.commitHash,
              branchName: externalRun.branchName,
              logs: externalRun.logs,
            },
          });
        }
      }

      return {
        success: true,
        synced: externalRuns.length,
        message: 'Successfully synced with external CI/CD system',
      };
    } catch (error) {
      console.error('Failed to sync with external CI/CD:', error);
      throw new Error(`Sync failed: ${error}`);
    }
  }

  /**
   * Update pipeline configuration
   */
  async updatePipeline(
    pipelineId: string,
    updates: Partial<CreatePipelineRequest>
  ) {
    const pipeline = await prisma.cICDPipeline.update({
      where: { id: pipelineId },
      data: {
        name: updates.name,
        pipelineUrl: updates.pipelineUrl,
        config: updates.config,
        isActive: true,
      },
    });

    return pipeline;
  }

  /**
   * Delete pipeline
   */
  async deletePipeline(pipelineId: string) {
    await prisma.cICDPipeline.delete({
      where: { id: pipelineId },
    });

    return { success: true, message: 'Pipeline deleted successfully' };
  }

  // Private helper methods

  private async triggerExternalPipeline(pipeline: any, data: TriggerPipelineRequest) {
    // Provider-specific logic to trigger pipeline
    switch (pipeline.provider) {
      case 'JENKINS':
        return await this.triggerJenkins(pipeline, data);
      case 'GITHUB_ACTIONS':
        return await this.triggerGitHubActions(pipeline, data);
      case 'GITLAB_CI':
        return await this.triggerGitLabCI(pipeline, data);
      case 'CIRCLE_CI':
        return await this.triggerCircleCI(pipeline, data);
      default:
        throw new Error(`Provider ${pipeline.provider} not supported`);
    }
  }

  private async triggerJenkins(pipeline: any, data: TriggerPipelineRequest) {
    const { baseUrl, jobName, token } = pipeline.config;

    if (!baseUrl || !jobName) {
      throw new Error('Jenkins configuration incomplete');
    }

    const url = `${baseUrl}/job/${jobName}/build`;
    const auth = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    await axios.post(url, data.parameters || {}, {
      headers: auth,
    });

    return { success: true };
  }

  private async triggerGitHubActions(pipeline: any, data: TriggerPipelineRequest) {
    const { owner, repo, workflow, token } = pipeline.config;

    if (!owner || !repo || !workflow || !token) {
      throw new Error('GitHub Actions configuration incomplete');
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`;

    await axios.post(
      url,
      {
        ref: data.branchName || 'main',
        inputs: data.parameters || {},
      },
      {
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return { success: true };
  }

  private async triggerGitLabCI(pipeline: any, data: TriggerPipelineRequest) {
    const { baseUrl, projectId, token } = pipeline.config;

    if (!baseUrl || !projectId || !token) {
      throw new Error('GitLab CI configuration incomplete');
    }

    const url = `${baseUrl}/api/v4/projects/${projectId}/trigger/pipeline`;

    await axios.post(url, {
      token,
      ref: data.branchName || 'main',
      variables: data.parameters || {},
    });

    return { success: true };
  }

  private async triggerCircleCI(pipeline: any, data: TriggerPipelineRequest) {
    const { projectSlug, token } = pipeline.config;

    if (!projectSlug || !token) {
      throw new Error('CircleCI configuration incomplete');
    }

    const url = `https://circleci.com/api/v2/project/${projectSlug}/pipeline`;

    await axios.post(
      url,
      {
        branch: data.branchName || 'main',
        parameters: data.parameters || {},
      },
      {
        headers: {
          'Circle-Token': token,
          'Content-Type': 'application/json',
        },
      }
    );

    return { success: true };
  }

  private async fetchExternalRuns(pipeline: any): Promise<any[]> {
    // Provider-specific logic to fetch runs
    // This would return a standardized format
    return [];
  }

  private async updateFlakyDetection(results: any[]) {
    // Update flaky test detection based on CI/CD results
    for (const result of results) {
      if (result.testCaseId) {
        // Would integrate with AI service to update flaky detection
        // aiService.detectFlakyTests({ testCaseId: result.testCaseId, runs: [...] });
      }
    }
  }
}

export default new CICDService();
