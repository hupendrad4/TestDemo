import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DashboardService {
  /**
   * Get workspace dashboard data
   */
  static async getWorkspaceDashboard(projectId: string) {
    // Test Cases Summary
    const testCasesSummary = await this.getTestCasesSummary(projectId);

    // Execution Summary
    const executionSummary = await this.getExecutionSummary(projectId);

    // Requirements Coverage
    const requirementCoverage = await this.getRequirementCoverage(projectId);

    // Defect Summary
    const defectSummary = await this.getDefectSummary(projectId);

    // Recent Test Runs
    const recentTestRuns = await this.getRecentTestRuns(projectId, 5);

    // Trend Data
    const trendData = await this.getExecutionTrends(projectId, 30);

    // Risk Widgets
    const riskMetrics = await this.getRiskMetrics(projectId);

    return {
      testCasesSummary,
      executionSummary,
      requirementCoverage,
      defectSummary,
      recentTestRuns,
      trendData,
      riskMetrics,
    };
  }

  /**
   * Get test cases summary
   */
  static async getTestCasesSummary(projectId: string) {
    const total = await prisma.testCase.count({
      where: {
        testSuite: {
          testProjectId: projectId,
        },
      },
    });

    const approved = await prisma.testCase.count({
      where: {
        testSuite: {
          testProjectId: projectId,
        },
        status: 'APPROVED',
      },
    });

    const draft = await prisma.testCase.count({
      where: {
        testSuite: {
          testProjectId: projectId,
        },
        status: 'DRAFT',
      },
    });

    const deprecated = await prisma.testCase.count({
      where: {
        testSuite: {
          testProjectId: projectId,
        },
        status: 'DEPRECATED',
      },
    });

    const automated = await prisma.testCase.count({
      where: {
        testSuite: {
          testProjectId: projectId,
        },
        executionType: 'AUTOMATED',
      },
    });

    return {
      total,
      approved,
      draft,
      deprecated,
      automated,
      manual: total - automated,
      automationPercentage: total > 0 ? ((automated / total) * 100).toFixed(2) : '0',
    };
  }

  /**
   * Get execution summary
   */
  static async getExecutionSummary(projectId: string) {
    // Get recent executions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const executions = await prisma.testExecution.findMany({
      where: {
        testCase: {
          testSuite: {
            testProjectId: projectId,
          },
        },
        executedAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        status: true,
      },
    });

    const total = executions.length;
    const passed = executions.filter((e) => e.status === 'PASSED').length;
    const failed = executions.filter((e) => e.status === 'FAILED').length;
    const blocked = executions.filter((e) => e.status === 'BLOCKED').length;
    const notRun = executions.filter((e) => e.status === 'NOT_RUN').length;
    const skipped = executions.filter((e) => e.status === 'SKIPPED').length;

    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';

    return {
      total,
      passed,
      failed,
      blocked,
      notRun,
      skipped,
      passRate: parseFloat(passRate),
      distribution: {
        passed: total > 0 ? ((passed / total) * 100).toFixed(1) : '0',
        failed: total > 0 ? ((failed / total) * 100).toFixed(1) : '0',
        blocked: total > 0 ? ((blocked / total) * 100).toFixed(1) : '0',
        notRun: total > 0 ? ((notRun / total) * 100).toFixed(1) : '0',
        skipped: total > 0 ? ((skipped / total) * 100).toFixed(1) : '0',
      },
    };
  }

  /**
   * Get requirement coverage
   */
  static async getRequirementCoverage(projectId: string) {
    const totalRequirements = await prisma.requirement.count({
      where: {
        testProjectId: projectId,
      },
    });

    const coveredRequirements = await prisma.requirement.count({
      where: {
        testProjectId: projectId,
        testCases: {
          some: {},
        },
      },
    });

    const coveragePercentage = totalRequirements > 0 
      ? ((coveredRequirements / totalRequirements) * 100).toFixed(1)
      : '0';

    return {
      total: totalRequirements,
      covered: coveredRequirements,
      uncovered: totalRequirements - coveredRequirements,
      coveragePercentage: parseFloat(coveragePercentage),
    };
  }

  /**
   * Get defect summary
   */
  static async getDefectSummary(projectId: string) {
    const defects = await prisma.defect.findMany({
      where: { testProjectId: projectId },
      select: { status: true, severity: true },
    });

    return {
      total: defects.length,
      open: defects.filter((d) => d.status === 'OPEN').length,
      inProgress: defects.filter((d) => d.status === 'IN_PROGRESS').length,
      resolved: defects.filter((d) => d.status === 'RESOLVED').length,
      closed: defects.filter((d) => d.status === 'CLOSED').length,
      bySeverity: {
        critical: defects.filter((d) => d.severity === 'CRITICAL').length,
        high: defects.filter((d) => d.severity === 'HIGH').length,
        medium: defects.filter((d) => d.severity === 'MEDIUM').length,
        low: defects.filter((d) => d.severity === 'LOW').length,
        blocker: defects.filter((d) => d.severity === 'BLOCKER').length,
      },
    };
  }

  /**
   * Get recent test runs
   */
  static async getRecentTestRuns(projectId: string, limit: number = 5) {
    return await prisma.testRun.findMany({
      where: {
        testPlan: {
          testProjectId: projectId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        testPlan: {
          select: {
            name: true,
          },
        },
        build: {
          select: {
            name: true,
          },
        },
        platform: {
          select: {
            name: true,
            type: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            runResults: true,
          },
        },
      },
    });
  }

  /**
   * Get execution trends over time
   */
  static async getExecutionTrends(projectId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const executions = await prisma.testExecution.findMany({
      where: {
        testCase: {
          testSuite: {
            testProjectId: projectId,
          },
        },
        executedAt: {
          gte: startDate,
        },
      },
      select: {
        executedAt: true,
        status: true,
      },
      orderBy: {
        executedAt: 'asc',
      },
    });

    // Group by date
    const trendMap = new Map<string, any>();

    executions.forEach((exec) => {
      const dateKey = exec.executedAt.toISOString().split('T')[0];
      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, {
          date: dateKey,
          total: 0,
          passed: 0,
          failed: 0,
          blocked: 0,
        });
      }

      const data = trendMap.get(dateKey);
      data.total++;
      if (exec.status === 'PASSED') data.passed++;
      if (exec.status === 'FAILED') data.failed++;
      if (exec.status === 'BLOCKED') data.blocked++;

      trendMap.set(dateKey, data);
    });

    // Calculate pass rates
    const trends = Array.from(trendMap.values()).map((data) => ({
      ...data,
      passRate: data.total > 0 ? ((data.passed / data.total) * 100).toFixed(1) : '0',
    }));

    return trends;
  }

  /**
   * Get risk metrics
   */
  static async getRiskMetrics(projectId: string) {
    // High priority failures (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const highPriorityFailures = await prisma.testExecution.count({
      where: {
        testCase: {
          testSuite: {
            testProjectId: projectId,
          },
          priority: {
            in: ['HIGH', 'CRITICAL'],
          },
        },
        status: 'FAILED',
        executedAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Uncovered high priority requirements
    const uncoveredHighPriorityReqs = await prisma.requirement.count({
      where: {
        testProjectId: projectId,
        priority: {
          in: ['HIGH', 'CRITICAL'],
        },
        testCases: {
          none: {},
        },
      },
    });

    // Failing builds (test runs with > 20% failure rate)
    const recentRuns = await prisma.testRun.findMany({
      where: {
        testPlan: {
          testProjectId: projectId,
        },
        status: 'COMPLETED',
      },
      include: {
        runResults: {
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 10,
    });

    const failingBuilds = recentRuns.filter((run) => {
      const total = run.runResults.length;
      const failed = run.runResults.filter((r) => r.status === 'FAILED').length;
      return total > 0 && (failed / total) > 0.2;
    }).length;

    // Blocked tests
    const blockedTests = await prisma.testExecution.count({
      where: {
        testCase: {
          testSuite: {
            testProjectId: projectId,
          },
        },
        status: 'BLOCKED',
        executedAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    return {
      highPriorityFailures,
      uncoveredHighPriorityReqs,
      failingBuilds,
      blockedTests,
    };
  }
}

export default DashboardService;
