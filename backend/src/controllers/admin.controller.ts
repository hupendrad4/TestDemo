import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// @desc    Admin metrics dashboard for any project
// @route   GET /api/admin/metrics?projectId=...
// @access  Private (Admin)
export const getAdminMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = (req.query.projectId as string) || '';
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'projectId query param is required' });
    }

    const project = await prisma.testProject.findUnique({
      where: { id: projectId },
      include: {
        _count: { select: { testSuites: true, testCases: true, testPlans: true, requirements: true } },
      },
    });

    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

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

    const allExecutions = await prisma.testExecution.findMany({
      where: { testCycle: { testPlan: { testProjectId: projectId } } },
      select: { status: true },
    });

    const executionStats: Record<string, any> = {
      total: allExecutions.length,
      notRun: allExecutions.filter((e) => e.status === 'NOT_RUN').length,
      passed: allExecutions.filter((e) => e.status === 'PASSED').length,
      failed: allExecutions.filter((e) => e.status === 'FAILED').length,
      blocked: allExecutions.filter((e) => e.status === 'BLOCKED').length,
      skipped: allExecutions.filter((e) => e.status === 'SKIPPED').length,
    };
    const executed = executionStats.total - executionStats.notRun - executionStats.skipped;
    executionStats.passRate = executed > 0 ? Math.round((executionStats.passed / executed) * 100) : 0;

    const defects = await prisma.defect.findMany({
      where: { executions: { some: { execution: { testCycle: { testPlan: { testProjectId: projectId } } } } } },
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

    return res.status(200).json({
      success: true,
      data: {
        project: { id: project.id, name: project.name, prefix: project.prefix, counts: project._count },
        testCases: testCaseStats,
        executions: executionStats,
        defects: defectStats,
      },
    });
  } catch (error) {
    next(error);
  }
};
