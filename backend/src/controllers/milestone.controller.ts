import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// @desc    Get project milestones
// @route   GET /api/milestones/projects/:projectId
// @access  Private
export const getProjectMilestones = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;

    const milestones = await prisma.milestone.findMany({
      where: { testProjectId: projectId },
      include: {
        testPlans: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { endDate: 'asc' },
    });

    res.status(200).json({
      success: true,
      count: milestones.length,
      data: milestones,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get milestone by ID
// @route   GET /api/milestones/:id
// @access  Private
export const getMilestone = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const milestone = await prisma.milestone.findUnique({
      where: { id: req.params.id },
      include: {
        testPlans: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!milestone) {
      return res.status(404).json({
        success: false,
        error: 'Milestone not found',
      });
    }

    res.status(200).json({
      success: true,
      data: milestone,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create milestone
// @route   POST /api/milestones/projects/:projectId
// @access  Private
export const createMilestone = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;
    const { name, description, startDate, endDate, status } = req.body;

    const milestone = await prisma.milestone.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status || 'PLANNED',
        testProjectId: projectId,
      },
    });

    res.status(201).json({
      success: true,
      data: milestone,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update milestone
// @route   PUT /api/milestones/:id
// @access  Private
export const updateMilestone = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, startDate, endDate, status } = req.body;

    const milestone = await prisma.milestone.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(status && { status }),
      },
      include: {
        testPlans: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: milestone,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete milestone
// @route   DELETE /api/milestones/:id
// @access  Private
export const deleteMilestone = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await prisma.milestone.delete({
      where: { id: req.params.id },
    });

    res.status(200).json({
      success: true,
      message: 'Milestone deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
