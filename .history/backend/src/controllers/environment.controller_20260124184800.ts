import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// @desc    Get all environments for a project
// @route   GET /api/projects/:projectId/environments
// @access  Private
export const getEnvironments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.params;

    const environments = await prisma.environment.findMany({
      where: { testProjectId: projectId },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      count: environments.length,
      data: environments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single environment
// @route   GET /api/environments/:id
// @access  Private
export const getEnvironment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const environment = await prisma.environment.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            executions: true,
            testRuns: true,
          },
        },
      },
    });

    if (!environment) {
      return res.status(404).json({
        success: false,
        error: 'Environment not found',
      });
    }

    res.status(200).json({
      success: true,
      data: environment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create environment
// @route   POST /api/projects/:projectId/environments
// @access  Private (Admin, Test Manager)
export const createEnvironment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.params;
    const { name, description, url, type } = req.body;

    // Check if environment already exists
    const existingEnvironment = await prisma.environment.findUnique({
      where: {
        testProjectId_name: {
          testProjectId: projectId,
          name,
        },
      },
    });

    if (existingEnvironment) {
      return res.status(400).json({
        success: false,
        error: 'Environment with this name already exists in the project',
      });
    }

    const environment = await prisma.environment.create({
      data: {
        name,
        description,
        url,
        type: type || 'CUSTOM',
        testProjectId: projectId,
      },
    });

    res.status(201).json({
      success: true,
      data: environment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update environment
// @route   PUT /api/environments/:id
// @access  Private (Admin, Test Manager)
export const updateEnvironment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, url, type, isActive } = req.body;

    const environment = await prisma.environment.findUnique({
      where: { id: req.params.id },
    });

    if (!environment) {
      return res.status(404).json({
        success: false,
        error: 'Environment not found',
      });
    }

    const updatedEnvironment = await prisma.environment.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        url,
        type,
        isActive,
      },
    });

    res.status(200).json({
      success: true,
      data: updatedEnvironment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete environment
// @route   DELETE /api/environments/:id
// @access  Private (Admin, Test Manager)
export const deleteEnvironment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const environment = await prisma.environment.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            executions: true,
            testRuns: true,
          },
        },
      },
    });

    if (!environment) {
      return res.status(404).json({
        success: false,
        error: 'Environment not found',
      });
    }

    // Check if environment is being used
    if (
      environment._count.executions > 0 ||
      environment._count.testRuns > 0
    ) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete environment that is being used in executions or test runs',
      });
    }

    await prisma.environment.delete({
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

// @desc    Create default environments for a project
// @route   POST /api/projects/:projectId/environments/defaults
// @access  Private (Admin, Test Manager)
export const createDefaultEnvironments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.params;

    const defaultEnvs = [
      { name: 'Development', type: 'DEV', description: 'Development environment' },
      { name: 'QA', type: 'QA', description: 'Quality Assurance environment' },
      { name: 'Staging', type: 'STAGING', description: 'Staging environment' },
      { name: 'Production', type: 'PRODUCTION', description: 'Production environment' },
    ];

    const createdEnvironments = [];

    for (const env of defaultEnvs) {
      const existing = await prisma.environment.findUnique({
        where: {
          testProjectId_name: {
            testProjectId: projectId,
            name: env.name,
          },
        },
      });

      if (!existing) {
        const created = await prisma.environment.create({
          data: {
            name: env.name,
            type: env.type,
            description: env.description,
            testProjectId: projectId,
          },
        });
        createdEnvironments.push(created);
      }
    }

    res.status(201).json({
      success: true,
      count: createdEnvironments.length,
      data: createdEnvironments,
    });
  } catch (error) {
    next(error);
  }
};
