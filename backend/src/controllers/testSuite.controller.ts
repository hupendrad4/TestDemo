import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// @desc    Get all test suites for a project
// @route   GET /api/projects/:projectId/test-suites
// @access  Private
export const getTestSuites = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;

    const testSuites = await prisma.testSuite.findMany({
      where: { testProjectId: projectId },
      include: {
        parent: {
          select: { id: true, name: true },
        },
        _count: {
          select: { testCases: true, children: true },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    res.status(200).json({
      success: true,
      count: testSuites.length,
      data: testSuites,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single test suite
// @route   GET /api/test-suites/:id
// @access  Private
export const getTestSuite = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const testSuite = await prisma.testSuite.findUnique({
      where: { id: req.params.id },
      include: {
        parent: {
          select: { id: true, name: true },
        },
        children: {
          include: {
            _count: {
              select: { testCases: true, children: true },
            },
          },
        },
        testCases: {
          include: {
            _count: {
              select: { testSteps: true },
            },
          },
        },
      },
    });

    if (!testSuite) {
      return res.status(404).json({
        success: false,
        error: 'Test suite not found',
      });
    }

    res.status(200).json({
      success: true,
      data: testSuite,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create test suite
// @route   POST /api/projects/:projectId/test-suites
// @access  Private (Admin, Test Manager, Tester)
export const createTestSuite = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;
    const { name, description, parentId, orderIndex } = req.body;

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

    // If parentId provided, verify it exists and belongs to same project
    if (parentId) {
      const parentSuite = await prisma.testSuite.findUnique({
        where: { id: parentId },
      });

      if (!parentSuite || parentSuite.testProjectId !== projectId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid parent test suite',
        });
      }
    }

    const testSuite = await prisma.testSuite.create({
      data: {
        name,
        description,
        testProjectId: projectId,
        parentId: parentId || null,
        orderIndex: orderIndex || 0,
      },
      include: {
        parent: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: testSuite,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update test suite
// @route   PUT /api/test-suites/:id
// @access  Private (Admin, Test Manager, Tester)
export const updateTestSuite = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, parentId, orderIndex } = req.body;

    const testSuite = await prisma.testSuite.findUnique({
      where: { id: req.params.id },
    });

    if (!testSuite) {
      return res.status(404).json({
        success: false,
        error: 'Test suite not found',
      });
    }

    // Prevent circular parent reference
    if (parentId && parentId === testSuite.id) {
      return res.status(400).json({
        success: false,
        error: 'Test suite cannot be its own parent',
      });
    }

    const updatedTestSuite = await prisma.testSuite.update({
      where: { id: req.params.id },
      data: {
        name: name || testSuite.name,
        description: description !== undefined ? description : testSuite.description,
        parentId: parentId !== undefined ? parentId : testSuite.parentId,
        orderIndex: orderIndex !== undefined ? orderIndex : testSuite.orderIndex,
      },
      include: {
        parent: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedTestSuite,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete test suite
// @route   DELETE /api/test-suites/:id
// @access  Private (Admin, Test Manager)
export const deleteTestSuite = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const testSuite = await prisma.testSuite.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { testCases: true, children: true },
        },
      },
    });

    if (!testSuite) {
      return res.status(404).json({
        success: false,
        error: 'Test suite not found',
      });
    }

    if (testSuite._count.testCases > 0 || testSuite._count.children > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete test suite with test cases or child suites',
      });
    }

    await prisma.testSuite.delete({
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
