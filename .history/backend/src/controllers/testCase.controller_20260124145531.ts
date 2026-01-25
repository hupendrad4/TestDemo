import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// @desc    Get all test cases
// @route   GET /api/projects/:projectId/test-cases
// @access  Private
export const getTestCases = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;
    const { suiteId, status, priority } = req.query;

    const where: any = {
      testSuite: { testProjectId: projectId }
    };
    
    if (suiteId) {
      where.testSuiteId = suiteId as string;
    }
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }

    const testCases = await prisma.testCase.findMany({
      where,
      include: {
        testSuite: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, username: true, email: true },
        },
        _count: {
          select: { steps: true, executions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: testCases.length,
      data: testCases,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single test case
// @route   GET /api/test-cases/:id
// @access  Private
export const getTestCase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const testCase = await prisma.testCase.findUnique({
      where: { id: req.params.id },
      include: {
        testSuite: {
          select: { id: true, name: true },
        },
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        keywords: {
          include: {
            keyword: true,
          },
        },
        requirements: {
          include: {
            requirement: {
              select: { id: true, title: true, externalId: true },
            },
          },
        },
        createdBy: {
          select: { id: true, username: true, email: true },
        },
        attachments: true,
      },
    });

    if (!testCase) {
      return res.status(404).json({
        success: false,
        error: 'Test case not found',
      });
    }

    res.status(200).json({
      success: true,
      data: testCase,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create test case
// @route   POST /api/projects/:projectId/test-cases
// @access  Private (Admin, Test Manager, Tester)
export const createTestCase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    const {
      testSuiteId,
      name,
      title,
      summary,
      description,
      preconditions,
      expectedBehavior,
      actualBehavior,
      executionType,
      status,
      priority,
      type,
      estimatedTime,
      testSteps,
      steps,
      format,
      gherkinScenario,
    } = req.body;

    // Handle field aliases (frontend might send 'title' or 'name', 'description' or 'summary')
    const finalName = name || title || 'Untitled Test Case';
    const finalSummary = summary || description;
    const finalFormat = format || 'TRADITIONAL';

    // Verify project exists
    const project = await prisma.testProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    // Get or create default test suite if not provided
    let finalTestSuiteId = testSuiteId;
    
    if (!finalTestSuiteId) {
      let defaultSuite = await prisma.testSuite.findFirst({
        where: { 
          testProjectId: projectId,
          name: 'Default Test Suite'
        },
      });

      if (!defaultSuite) {
        defaultSuite = await prisma.testSuite.create({
          data: {
            name: 'Default Test Suite',
            description: 'Default test suite for uncategorized test cases',
            testProjectId: projectId,
          },
        });
      }

      finalTestSuiteId = defaultSuite.id;
    } else {
      // Verify test suite exists and belongs to project
      const testSuite = await prisma.testSuite.findUnique({
        where: { id: testSuiteId },
      });

      if (!testSuite || testSuite.testProjectId !== projectId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid test suite',
        });
      }
    }

    // Generate external ID based on count within project
    const caseCount = await prisma.testCase.count({
      where: { testSuite: { testProjectId: projectId } }
    });
    const externalId = `${project!.prefix}-${caseCount + 1}`;

    // Auto-create a default step if expectedBehavior provided but no steps
    const finalSteps = testSteps || steps;
    let stepsToCreate = finalSteps;
    
    if (!stepsToCreate && expectedBehavior) {
      stepsToCreate = [{
        action: 'Execute test case',
        expectedResult: expectedBehavior,
        testData: actualBehavior || null,
      }];
    }

    // Create test case with steps
    const testCase = await prisma.testCase.create({
      data: {
        testSuiteId: finalTestSuiteId,
        externalId,
        name: finalName,
        summary: finalSummary,
        preconditions,
        executionType: executionType || 'MANUAL',
        status: status || 'DRAFT',
        priority: priority || 'MEDIUM',
        estimatedTime,
        format: finalFormat,
        gherkinScenario: finalFormat === 'BDD' ? gherkinScenario : null,
        version: 1,
        createdById: req.user.id,
        steps: stepsToCreate && finalFormat === 'TRADITIONAL'
          ? {
              create: stepsToCreate.map((step: any, index: number) => ({
                stepNumber: index + 1,
                action: step.action || step.description || 'Execute step',
                expectedResult: step.expectedResult || step.expected || '',
                testData: step.testData || step.data,
              })),
            }
          : undefined,
      },
      include: {
        testSuite: {
          select: { id: true, name: true },
        },
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        createdBy: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: testCase,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update test case
// @route   PUT /api/test-cases/:id
// @access  Private (Admin, Test Manager, Tester)
export const updateTestCase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      summary,
      preconditions,
      status,
      priority,
      estimatedTime,
      testSteps,
    } = req.body;

    const testCase = await prisma.testCase.findUnique({
      where: { id: req.params.id },
      include: { steps: true },
    });

    if (!testCase) {
      return res.status(404).json({
        success: false,
        error: 'Test case not found',
      });
    }

    // If test steps are being updated, delete old ones and create new ones
    if (testSteps) {
      await prisma.testStep.deleteMany({
        where: { testCaseId: testCase.id },
      });
    }

    const updatedTestCase = await prisma.testCase.update({
      where: { id: req.params.id },
      data: {
        name: name || testCase.name,
        summary: summary !== undefined ? summary : testCase.summary,
        preconditions: preconditions !== undefined ? preconditions : testCase.preconditions,
        status: status || testCase.status,
        priority: priority || testCase.priority,
        estimatedTime: estimatedTime !== undefined ? estimatedTime : testCase.estimatedTime,
        version: testSteps ? testCase.version + 1 : testCase.version,
        steps: testSteps
          ? {
              create: testSteps.map((step: any, index: number) => ({
                stepNumber: index + 1,
                action: step.action,
                expectedResult: step.expectedResult,
                testData: step.testData,
              })),
            }
          : undefined,
      },
      include: {
        testSuite: {
          select: { id: true, name: true },
        },
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        createdBy: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedTestCase,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete test case
// @route   DELETE /api/test-cases/:id
// @access  Private (Admin, Test Manager)
export const deleteTestCase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const testCase = await prisma.testCase.findUnique({
      where: { id: req.params.id },
    });

    if (!testCase) {
      return res.status(404).json({
        success: false,
        error: 'Test case not found',
      });
    }

    await prisma.testCase.delete({
      where: { id: req.params.id },
    });

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get test cases by project (alternative route)
// @route   GET /api/test-cases/projects/:projectId
// @access  Private
export const getTestCasesByProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;
    const { suiteId, status, priority } = req.query;

    const where: any = {
      testSuite: { testProjectId: projectId }
    };
    
    if (suiteId) {
      where.testSuiteId = suiteId as string;
    }
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }

    const testCases = await prisma.testCase.findMany({
      where,
      include: {
        testSuite: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, username: true, email: true },
        },
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        _count: {
          select: { steps: true, executions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: testCases.length,
      data: testCases,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add test steps to a test case
// @route   POST /api/test-cases/:id/steps
// @access  Private
export const addTestSteps = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const testCaseId = req.params.id;
    const { steps } = req.body;

    // Verify test case exists
    const testCase = await prisma.testCase.findUnique({
      where: { id: testCaseId },
    });

    if (!testCase) {
      return res.status(404).json({
        success: false,
        error: 'Test case not found',
      });
    }

    // Delete existing steps if any
    await prisma.testStep.deleteMany({
      where: { testCaseId },
    });

    // Create new steps
    if (steps && steps.length > 0) {
      await prisma.testStep.createMany({
        data: steps.map((step: any, index: number) => ({
          testCaseId,
          stepNumber: index + 1,
          action: step.action || step.description,
          expectedResult: step.expectedResult,
          testData: step.testData,
        })),
      });
    }

    // Fetch updated test case with steps
    const updatedTestCase = await prisma.testCase.findUnique({
      where: { id: testCaseId },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedTestCase,
    });
  } catch (error) {
    next(error);
  }
};
