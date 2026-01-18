import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// @desc    Get dashboard metrics
// @route   GET /api/projects/:projectId/reports/dashboard
// @access  Private
export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;

    // Get project with counts
    const project = await prisma.testProject.findUnique({
      where: { id: projectId },
      include: {
        _count: {
          select: {
            testSuites: true,
            testPlans: true,
            requirements: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    // Get test case statistics
    const testCases = await prisma.testCase.findMany({
      where: { testSuite: { testProjectId: projectId } },
      select: { status: true, priority: true },
    });

    const testCaseStats = {
      total: testCases.length,
      byStatus: {
        draft: testCases.filter((tc) => tc.status === 'DRAFT').length,
        readyForReview: testCases.filter((tc) => tc.status === 'READY_FOR_REVIEW').length,
        approved: testCases.filter((tc) => tc.status === 'APPROVED').length,
        deprecated: testCases.filter((tc) => tc.status === 'DEPRECATED').length,
      },
      byPriority: {
        critical: testCases.filter((tc) => tc.priority === 'CRITICAL').length,
        high: testCases.filter((tc) => tc.priority === 'HIGH').length,
        medium: testCases.filter((tc) => tc.priority === 'MEDIUM').length,
        low: testCases.filter((tc) => tc.priority === 'LOW').length,
      },
    };

    // Get recent test executions
    const recentExecutions = await prisma.testExecution.findMany({
      where: {
        testCycle: {
          testPlan: {
            testProjectId: projectId,
          },
        },
      },
      take: 10,
      orderBy: { executedAt: 'desc' },
      include: {
        testCase: {
          select: { id: true, externalId: true, name: true },
        },
        executedBy: {
          select: { id: true, username: true },
        },
      },
    });

    // Get execution statistics
    const allExecutions = await prisma.testExecution.findMany({
      where: {
        testCycle: {
          testPlan: {
            testProjectId: projectId,
          },
        },
      },
      select: { status: true },
    });

    const executionStats = {
      total: allExecutions.length,
      notRun: allExecutions.filter((e) => e.status === 'NOT_RUN').length,
      passed: allExecutions.filter((e) => e.status === 'PASSED').length,
      failed: allExecutions.filter((e) => e.status === 'FAILED').length,
      blocked: allExecutions.filter((e) => e.status === 'BLOCKED').length,
      skipped: allExecutions.filter((e) => e.status === 'SKIPPED').length,
    };

    const executed = executionStats.total - executionStats.notRun - executionStats.skipped;
    executionStats['passRate'] = executed > 0
      ? Math.round((executionStats.passed / executed) * 100)
      : 0;

    // Get defect statistics
    const defects = await prisma.defect.findMany({
      where: {
        executions: {
          some: {
            execution: {
              testCycle: {
                testPlan: { testProjectId: projectId },
              },
            },
          },
        },
      },
      select: { status: true, severity: true },
    });

    const defectStats = {
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
      },
    };

    // Get requirements coverage
    const requirements = await prisma.requirement.findMany({
      where: { testProjectId: projectId },
      include: {
        _count: {
          select: { testCases: true },
        },
      },
    });

    const requirementStats = {
      total: requirements.length,
      covered: requirements.filter((r) => r._count.testCases > 0).length,
      uncovered: requirements.filter((r) => r._count.testCases === 0).length,
      coveragePercentage:
        requirements.length > 0
          ? Math.round(
              (requirements.filter((r) => r._count.testCases > 0).length /
                requirements.length) *
                100
            )
          : 0,
    };

    res.status(200).json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          prefix: project.prefix,
          counts: project._count,
        },
        testCases: testCaseStats,
        executions: executionStats,
        defects: defectStats,
        requirements: requirementStats,
        recentExecutions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get test coverage report
// @route   GET /api/projects/:projectId/reports/coverage
// @access  Private
export const getCoverageReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;

    const requirements = await prisma.requirement.findMany({
      where: { testProjectId: projectId },
      include: {
        testCases: {
          include: {
            testCase: {
              select: {
                id: true,
                externalId: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    });

    const coverageData = requirements.map((req) => ({
      id: req.id,
      externalId: req.externalId,
      title: req.title,
      // type is not present in schema; omit
      status: req.status,
      testCaseCount: req.testCases.length,
      testCases: req.testCases.map((tc) => tc.testCase),
      isCovered: req.testCases.length > 0,
    }));

    const summary = {
      totalRequirements: requirements.length,
      coveredRequirements: coverageData.filter((r) => r.isCovered).length,
      uncoveredRequirements: coverageData.filter((r) => !r.isCovered).length,
      coveragePercentage:
        requirements.length > 0
          ? Math.round(
              (coverageData.filter((r) => r.isCovered).length / requirements.length) *
                100
            )
          : 0,
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
        requirements: coverageData,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get execution report
// @route   GET /api/test-cycles/:cycleId/reports/execution
// @access  Private
export const getExecutionReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cycleId = parseInt(req.params.cycleId);

    const testCycle = await prisma.testCycle.findUnique({
      where: { id: cycleId },
      include: {
        testPlan: {
          include: {
            testProject: {
              select: { id: true, name: true, prefix: true },
            },
          },
        },
        executions: {
          include: {
            testCase: {
              select: {
                id: true,
                externalId: true,
                name: true,
                priority: true,
              },
            },
            executedBy: {
              select: { id: true, username: true, email: true },
            },
          },
        },
      },
    });

    if (!testCycle) {
      return res.status(404).json({
        success: false,
        error: 'Test cycle not found',
      });
    }

    const executions = testCycle.testExecutions;

    const summary = {
      total: executions.length,
      notRun: executions.filter((e) => e.status === 'NOT_RUN').length,
      passed: executions.filter((e) => e.status === 'PASSED').length,
      failed: executions.filter((e) => e.status === 'FAILED').length,
      blocked: executions.filter((e) => e.status === 'BLOCKED').length,
      skipped: executions.filter((e) => e.status === 'SKIPPED').length,
    };

    const executed = summary.total - summary.notRun - summary.skipped;
    summary['passRate'] = executed > 0
      ? Math.round((summary.passed / executed) * 100)
      : 0;

    summary['totalExecutionTime'] = executions.reduce(
      (sum, e) => sum + (e.executionTime || 0),
      0
    );

    res.status(200).json({
      success: true,
      data: {
        testCycle: {
          id: testCycle.id,
          name: testCycle.name,
          type: testCycle.type,
          testPlan: testCycle.testPlan,
        },
        summary,
        executions: executions.map((e) => ({
          id: e.id,
          testCase: e.testCase,
          status: e.status,
          executedBy: e.executedBy,
          executedAt: e.executedAt,
          executionTime: e.executionTime,
          notes: e.notes,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user activity report
// @route   GET /api/projects/:projectId/reports/user-activity
// @access  Private (Admin, Test Manager)
export const getUserActivityReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;

    // Get test case creation by user
    const testCasesByUser = await prisma.testCase.groupBy({
      by: ['createdById'],
      where: { testSuite: { testProjectId: projectId } },
      _count: true,
    });

    // Get test executions by user
    const executionsByUser = await prisma.testExecution.groupBy({
      by: ['executedById'],
      where: {
        testCycle: {
          testPlan: {
            testProjectId: projectId,
          },
        },
        executedById: { not: null },
      },
      _count: true,
    });

    // Get defects by user
    const defectsByUser = await prisma.defect.groupBy({
      by: ['reportedById'],
      where: {
        executions: {
          some: {
            execution: {
              testCycle: { testPlan: { testProjectId: projectId } },
            },
          },
        },
      },
      _count: true,
    });

    // Get user details
    const userIds = [
      ...new Set([
        ...testCasesByUser.map((u) => u.createdById),
        ...executionsByUser.map((u) => u.executedById!),
        ...defectsByUser.map((u) => u.reportedById),
      ]),
    ];

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, email: true, role: true },
    });

    const userActivity = users.map((user) => ({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      testCasesCreated:
        testCasesByUser.find((u) => u.createdById === user.id)?._count || 0,
      testExecutions:
        executionsByUser.find((u) => u.executedById === user.id)?._count || 0,
      defectsReported:
        defectsByUser.find((u) => u.reportedById === user.id)?._count || 0,
    }));

    res.status(200).json({
      success: true,
      data: userActivity,
    });
  } catch (error) {
    next(error);
  }
};
