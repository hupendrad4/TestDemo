import { Request, Response, NextFunction } from 'express';
import { PrismaClient, ExecutionStatus } from '@prisma/client';

const prisma = new PrismaClient();

// @desc    Create test cycle
// @route   POST /api/test-plans/:testPlanId/cycles
// @access  Private (Admin, Test Manager)
export const createTestCycle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const testPlanId = req.params.testPlanId;
    const { name, description, type, buildId, testCaseIds } = req.body;

    // Verify test plan exists
    const testPlan = await prisma.testPlan.findUnique({
      where: { id: testPlanId },
    });

    if (!testPlan) {
      return res.status(404).json({
        success: false,
        error: 'Test plan not found',
      });
    }

    // If buildId provided, verify it belongs to the test plan
    if (buildId) {
      const build = await prisma.build.findUnique({ where: { id: buildId } });
      if (!build || build.testPlanId !== testPlanId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid build for this test plan',
        });
      }
    }

    // Create test cycle with optional initial test executions
    const testCycle = await prisma.testCycle.create({
      data: {
        name,
        description,
        type: (type as any) || 'REGRESSION',
        testPlanId,
        executions: testCaseIds && buildId
          ? {
              create: (testCaseIds as string[]).map((tcId) => ({
                testCaseId: tcId,
                status: 'NOT_RUN',
                buildId,
              })),
            }
          : undefined,
      },
      include: {
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
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: testCycle,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get test cycle
// @route   GET /api/test-cycles/:id
// @access  Private
export const getTestCycle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const testCycle = await prisma.testCycle.findUnique({
      where: { id: req.params.id },
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
              include: {
                steps: {
                  orderBy: { stepNumber: 'asc' },
                },
              },
            },
            executedBy: {
              select: { id: true, username: true, email: true },
            },
            stepExecutions: {
              include: { testStep: true },
              orderBy: { executedAt: 'asc' },
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

    res.status(200).json({
      success: true,
      data: testCycle,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Execute test case (update execution)
// @route   PUT /api/test-executions/:id
// @access  Private (All authenticated users)
export const executeTestCase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, notes, executionTime, stepResults } = req.body;

    const execution = await prisma.testExecution.findUnique({
      where: { id: req.params.id },
      include: {
        testCase: {
          include: {
            steps: {
              orderBy: { stepNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Test execution not found',
      });
    }

    // Delete existing step executions if updating
    if (stepResults) {
      await prisma.testStepExecution.deleteMany({
        where: { testExecutionId: execution.id },
      });
    }

    const updatedExecution = await prisma.testExecution.update({
      where: { id: req.params.id },
      data: {
        status: (status as ExecutionStatus) || execution.status,
        notes: notes !== undefined ? notes : execution.notes,
        executionTime: executionTime !== undefined ? executionTime : execution.executionTime,
        executedAt: new Date(),
        executedById: req.user.id,
        stepExecutions: stepResults
          ? {
              create: (stepResults as Array<any>).map((step) => ({
                testStepId: step.testStepId,
                status: step.status as ExecutionStatus,
                actualResult: step.actualResult,
                notes: step.notes,
              })),
            }
          : undefined,
      },
      include: {
        testCase: {
          select: {
            id: true,
            externalId: true,
            name: true,
          },
        },
        executedBy: {
          select: { id: true, username: true, email: true },
        },
        stepExecutions: {
          include: { testStep: true },
          orderBy: { executedAt: 'asc' },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedExecution,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get test executions
// @route   GET /api/test-cycles/:cycleId/executions
// @access  Private
export const getTestExecutions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cycleId = req.params.cycleId;
    const { status } = req.query;

    const where: any = { testCycleId: cycleId };
    if (status) {
      where.status = status;
    }

    const executions = await prisma.testExecution.findMany({
      where,
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
      orderBy: { executedAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: executions.length,
      data: executions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get execution statistics
// @route   GET /api/test-cycles/:cycleId/stats
// @access  Private
export const getExecutionStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cycleId = req.params.cycleId;

    const executions = await prisma.testExecution.findMany({
      where: { testCycleId: cycleId },
      select: { status: true },
    });

    const stats = {
      total: executions.length,
      notRun: executions.filter((e) => e.status === 'NOT_RUN').length,
      passed: executions.filter((e) => e.status === 'PASSED').length,
      failed: executions.filter((e) => e.status === 'FAILED').length,
      blocked: executions.filter((e) => e.status === 'BLOCKED').length,
      skipped: executions.filter((e) => e.status === 'SKIPPED').length,
    };

    const executedTotal = stats.total - stats.notRun - stats.skipped;
    (stats as any)['passRate'] = executedTotal > 0
      ? Math.round((stats.passed / executedTotal) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project executions
// @route   GET /api/executions/projects/:projectId
// @access  Private
export const getProjectExecutions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;
    const { status, executedById } = req.query;

    const executions = await prisma.testExecution.findMany({
      where: {
        testCase: {
          testSuite: {
            testProjectId: projectId,
          },
        },
        ...(status && { status: status as ExecutionStatus }),
        ...(executedById && { executedById: executedById as string }),
      },
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
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        environment: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { executedAt: 'desc' },
      take: 100,
    });

    res.status(200).json({
      success: true,
      count: executions.length,
      data: executions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my executions
// @route   GET /api/executions/projects/:projectId/my-executions
// @access  Private
export const getMyExecutions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;

    const executions = await prisma.testExecution.findMany({
      where: {
        executedById: req.user!.id,
        testCase: {
          testSuite: {
            testProjectId: projectId,
          },
        },
      },
      include: {
        testCase: {
          select: {
            id: true,
            externalId: true,
            name: true,
            priority: true,
          },
        },
      },
      orderBy: { executedAt: 'desc' },
      take: 50,
    });

    res.status(200).json({
      success: true,
      count: executions.length,
      data: executions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get execution by ID
// @route   GET /api/executions/:id
// @access  Private
export const getExecutionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const execution = await prisma.testExecution.findUnique({
      where: { id: req.params.id },
      include: {
        testCase: {
          include: {
            steps: {
              orderBy: { stepNumber: 'asc' },
            },
          },
        },
        executedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        stepExecutions: {
          include: {
            testStep: true,
          },
          orderBy: { executedAt: 'asc' },
        },
      },
    });

    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found',
      });
    }

    res.status(200).json({
      success: true,
      data: execution,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign execution to user
// @route   PUT /api/executions/:id/assign
// @access  Private
export const assignExecution = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.body;

    const execution = await prisma.testExecution.update({
      where: { id: req.params.id },
      data: { executedById: userId },
      include: {
        testCase: {
          select: {
            id: true,
            externalId: true,
            name: true,
          },
        },
        executedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: execution,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk assign executions
// @route   POST /api/executions/bulk-assign
// @access  Private
export const bulkAssignExecutions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { testCaseIds, userId, buildId } = req.body;

    if (!testCaseIds || !Array.isArray(testCaseIds) || testCaseIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'testCaseIds array is required',
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    // Create executions if they don't exist
    const executions = await Promise.all(
      testCaseIds.map(async (testCaseId) => {
        // Try to find existing execution
        let execution = await prisma.testExecution.findFirst({
          where: {
            testCaseId,
            ...(buildId && { buildId }),
          },
        });

        if (!execution) {
          // Create new execution
          execution = await prisma.testExecution.create({
            data: {
              testCaseId,
              testCycleId: '', // Default empty, will need proper test cycle
              buildId: buildId || '',
              executedById: userId,
              status: 'NOT_RUN',
            },
          });
        } else {
          // Update existing execution
          execution = await prisma.testExecution.update({
            where: { id: execution.id },
            data: { executedById: userId },
          });
        }

        return execution;
      })
    );

    res.status(200).json({
      success: true,
      count: executions.length,
      data: executions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update execution
// @route   PUT /api/executions/executions/:id
// @access  Private
export const updateExecution = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, notes, executionTime } = req.body;

    const execution = await prisma.testExecution.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status: status as ExecutionStatus }),
        ...(notes !== undefined && { notes }),
        ...(executionTime !== undefined && { executionTime }),
        executedAt: new Date(),
      },
      include: {
        testCase: {
          select: {
            id: true,
            externalId: true,
            name: true,
          },
        },
        executedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: execution,
    });
  } catch (error) {
    next(error);
  }
};
