import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// @desc    Get all test plans
// @route   GET /api/projects/:projectId/test-plans
// @access  Private
export const getTestPlans = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;

    const testPlans = await prisma.testPlan.findMany({
      where: { testProjectId: projectId },
      include: {
        builds: true,
        _count: { select: { testCycles: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: testPlans.length,
      data: testPlans,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single test plan
// @route   GET /api/test-plans/:id
// @access  Private
export const getTestPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const testPlan = await prisma.testPlan.findUnique({
      where: { id: req.params.id },
      include: {
        builds: true,
        testCycles: {
          include: {
            executions: {
              include: {
                testCase: {
                  select: { id: true, externalId: true, name: true },
                },
                executedBy: {
                  select: { id: true, username: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!testPlan) {
      return res.status(404).json({
        success: false,
        error: 'Test plan not found',
      });
    }

    res.status(200).json({
      success: true,
      data: testPlan,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create test plan
// @route   POST /api/projects/:projectId/test-plans
// @access  Private (Admin, Test Manager)
export const createTestPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;
    const { name, description, isActive } = req.body;

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

    const testPlan = await prisma.testPlan.create({
      data: {
        name,
        description,
        testProjectId: projectId,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        builds: true,
      },
    });

    res.status(201).json({
      success: true,
      data: testPlan,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update test plan
// @route   PUT /api/test-plans/:id
// @access  Private (Admin, Test Manager)
export const updateTestPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, isActive } = req.body;

    const testPlan = await prisma.testPlan.findUnique({
      where: { id: req.params.id },
    });

    if (!testPlan) {
      return res.status(404).json({
        success: false,
        error: 'Test plan not found',
      });
    }

    const updatedTestPlan = await prisma.testPlan.update({
      where: { id: req.params.id },
      data: {
        name: name || testPlan.name,
        description: description !== undefined ? description : testPlan.description,
        isActive: isActive !== undefined ? isActive : testPlan.isActive,
      },
      include: {
        builds: true,
      },
    });

    res.status(200).json({
      success: true,
      data: updatedTestPlan,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete test plan
// @route   DELETE /api/test-plans/:id
// @access  Private (Admin)
export const deleteTestPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const testPlan = await prisma.testPlan.findUnique({
      where: { id: req.params.id },
    });

    if (!testPlan) {
      return res.status(404).json({
        success: false,
        error: 'Test plan not found',
      });
    }

    await prisma.testPlan.delete({
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

// @desc    Create build
// @route   POST /api/projects/:projectId/builds
// @access  Private (Admin, Test Manager)
export const createBuild = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const testPlanId = req.params.testPlanId;
    const { name, description, releaseDate, isActive } = req.body;

    // Verify test plan exists
    const tp = await prisma.testPlan.findUnique({ where: { id: testPlanId } });
    if (!tp) {
      return res.status(404).json({ success: false, error: 'Test plan not found' });
    }

    const build = await prisma.build.create({
      data: {
        name,
        description,
        releaseDate: releaseDate ? new Date(releaseDate) : undefined,
        testPlanId,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json({
      success: true,
      data: build,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get builds for project
// @route   GET /api/projects/:projectId/builds
// @access  Private
export const getBuilds = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const testPlanId = req.params.testPlanId;

    const builds = await prisma.build.findMany({
      where: { testPlanId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: builds.length,
      data: builds,
    });
  } catch (error) {
    next(error);
  }
};
