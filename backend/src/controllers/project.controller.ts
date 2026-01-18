import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as any;
    let where: any = {};
    // Non-admin users: see public projects or projects assigned via membership table
    if (!authReq.user || (authReq.user && authReq.user.role !== 'ADMIN')) {
      let memberProjectIds: string[] = [];
      if (authReq.user?.id) {
        const memberships = await prisma.projectMember.findMany({
          where: { userId: authReq.user.id },
          select: { testProjectId: true },
        });
        memberProjectIds = memberships.map((m) => m.testProjectId);
      }
      where = {
        OR: [
          { isPublic: true },
          memberProjectIds.length > 0 ? { id: { in: memberProjectIds } } : undefined,
        ].filter(Boolean),
      };
    }

    const projects = await prisma.testProject.findMany({
      where,
      include: {
        _count: {
          select: {
            testSuites: true,
            testPlans: true,
            requirements: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
export const getProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const project = await prisma.testProject.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            testSuites: true,
            testPlans: true,
            requirements: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        testSuites: {
          where: { parentId: null },
          include: {
            _count: {
              select: { testCases: true, children: true },
            },
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

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private (Admin, Test Manager)
export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, prefix, description, isActive, isPublic } = req.body;

    // Check if prefix already exists
    const existingProject = await prisma.testProject.findUnique({
      where: { prefix },
    });

    if (existingProject) {
      return res.status(400).json({
        success: false,
        error: 'Project prefix already exists',
      });
    }

    const project = await prisma.testProject.create({
      data: {
        name,
        prefix,
        description,
        isActive: isActive !== undefined ? isActive : true,
        isPublic: isPublic !== undefined ? isPublic : false,
        createdById: req.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin, Test Manager)
export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, isActive, isPublic } = req.body;

    const project = await prisma.testProject.findUnique({
      where: { id: req.params.id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    const updatedProject = await prisma.testProject.update({
      where: { id: req.params.id },
      data: {
        name: name || project.name,
        description: description !== undefined ? description : project.description,
        isActive: isActive !== undefined ? isActive : project.isActive,
        isPublic: isPublic !== undefined ? isPublic : project.isPublic,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedProject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin)
export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const project = await prisma.testProject.findUnique({
      where: { id: req.params.id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    await prisma.testProject.delete({
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

// @desc    Add user to project
// @route   POST /api/projects/:id/members
// @access  Private (Admin, Test Manager)
export const addProjectMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, role } = req.body as { userId: string; role?: string };
    const projectId = req.params.id;
    const project = await prisma.testProject.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const member = await prisma.projectMember.upsert({
      where: { testProjectId_userId: { testProjectId: projectId, userId } },
      update: { role: role || 'MEMBER' },
      create: { testProjectId: projectId, userId, role: role || 'MEMBER' },
    });

    res.status(200).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove user from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (Admin, Test Manager)
export const removeProjectMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.id;
    const userId = req.params.userId;
    await prisma.projectMember.delete({
      where: { testProjectId_userId: { testProjectId: projectId, userId } },
    });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// @desc    List project members
// @route   GET /api/projects/:id/members
// @access  Private
export const listProjectMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.id;
    const members = await prisma.projectMember.findMany({
      where: { testProjectId: projectId },
      select: {
        userId: true,
        role: true,
        user: { select: { id: true, username: true, email: true, role: true } },
      },
    });
    res.status(200).json({ success: true, count: members.length, data: members });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a project member's role
// @route   PATCH /api/projects/:id/members/:userId
// @access  Private (Admin, Test Manager)
export const updateProjectMemberRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.id;
    const userId = req.params.userId;
    const { role } = req.body as { role: string };

    if (!role || typeof role !== 'string') {
      return res.status(400).json({ success: false, error: 'role is required' });
    }

    const exists = await prisma.projectMember.findUnique({
      where: { testProjectId_userId: { testProjectId: projectId, userId } },
    });
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Membership not found' });
    }

    const updated = await prisma.projectMember.update({
      where: { testProjectId_userId: { testProjectId: projectId, userId } },
      data: { role },
      select: { userId: true, role: true },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my projects
// @route   GET /api/projects/my-projects
// @access  Private
export const getMyProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as any;
    // Get membership project IDs
    const memberships = await prisma.projectMember.findMany({
      where: { userId: authReq.user.id },
      select: { testProjectId: true },
    });
    const memberProjectIds = memberships.map((m) => m.testProjectId);

    const projects = await prisma.testProject.findMany({
      where: {
        OR: [
          { isPublic: true },
          memberProjectIds.length > 0 ? { id: { in: memberProjectIds } } : undefined,
        ].filter(Boolean),
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    next(error);
  }
};
