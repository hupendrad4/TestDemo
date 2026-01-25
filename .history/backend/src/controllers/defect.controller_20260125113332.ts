import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// @desc    Get all defects
// @route   GET /api/projects/:projectId/defects
// @access  Private
export const getDefects = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const { status, severity, priority } = req.query;

    const where: any = { projectId };
    if (status) {
      where.status = status;
    }
    if (severity) {
      where.severity = severity;
    }
    if (priority) {
      where.priority = priority;
    }

    const defects = await prisma.defect.findMany({
      where,
      include: {
        reportedBy: {
          select: { id: true, username: true, email: true },
        },
        assignedTo: {
          select: { id: true, username: true, email: true },
        },
        _count: {
          select: { comments: true, attachments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: defects.length,
      data: defects,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single defect
// @route   GET /api/defects/:id
// @access  Private
export const getDefect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const defect = await prisma.defect.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        reportedBy: {
          select: { id: true, username: true, email: true },
        },
        assignedTo: {
          select: { id: true, username: true, email: true },
        },
        testExecutions: {
          include: {
            testExecution: {
              include: {
                testCase: {
                  select: { id: true, externalId: true, name: true },
                },
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: { id: true, username: true, email: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!defect) {
      return res.status(404).json({
        success: false,
        error: 'Defect not found',
      });
    }

    res.status(200).json({
      success: true,
      data: defect,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create defect
// @route   POST /api/projects/:projectId/defects
// @access  Private (All authenticated users)
export const createDefect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;
    const {
      title,
      description,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      severity,
      priority,
      assignedToId,
      testExecutionId,
      jiraIssueKey,
    } = req.body;

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

    // Generate external ID
    const defectCount = await prisma.defect.count();
    const externalId = `${project.prefix}-BUG-${defectCount + 1}`;

    const defect = await prisma.defect.create({
      data: {
        externalId,
        title,
        description,
        stepsToReproduce,
        expectedBehavior,
        actualBehavior,
        severity: severity || 'MEDIUM',
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        reportedById: req.user!.id,
        assignedToId: assignedToId || null,
        executions: testExecutionId
          ? {
              create: {
                testExecutionId,
              },
            }
          : undefined,
      },
      include: {
        reportedBy: {
          select: { id: true, username: true, email: true },
        },
        assignedTo: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    // Create Jira link if jiraIssueKey is provided
    if (jiraIssueKey && jiraIssueKey.trim()) {
      try {
        const jiraIntegration = await prisma.jiraIntegration.findUnique({
          where: { testProjectId: projectId },
        });

        if (jiraIntegration && jiraIntegration.isActive) {
          const jiraProjectKey = jiraIssueKey.split('-')[0];
          let jiraProject = await prisma.jiraProject.findFirst({
            where: { 
              jiraIntegrationId: jiraIntegration.id,
              jiraProjectKey: jiraProjectKey
            },
          });

          if (!jiraProject) {
            jiraProject = await prisma.jiraProject.create({
              data: {
                jiraIntegrationId: jiraIntegration.id,
                jiraProjectKey: jiraProjectKey,
                jiraProjectId: jiraProjectKey,
                jiraProjectName: jiraProjectKey,
              },
            });
          }

          await prisma.jiraLink.create({
            data: {
              jiraIntegrationId: jiraIntegration.id,
              jiraProjectId: jiraProject.id,
              jiraIssueKey: jiraIssueKey.toUpperCase(),
              jiraIssueId: jiraIssueKey,
              jiraIssueType: 'Bug',
              jiraIssueSummary: defect.title,
              jiraIssueStatus: 'Open',
              entityType: 'DEFECT',
              entityId: defect.id,
              syncStatus: 'PENDING',
            },
          });
        }
      } catch (jiraError) {
        console.error('Failed to create Jira link:', jiraError);
      }
    }

    res.status(201).json({
      success: true,
      data: defect,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update defect
// @route   PUT /api/defects/:id
// @access  Private (All authenticated users)
export const updateDefect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      title,
      description,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      severity,
      priority,
      status,
      assignedToId,
      resolution,
    } = req.body;

    const defect = await prisma.defect.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!defect) {
      return res.status(404).json({
        success: false,
        error: 'Defect not found',
      });
    }

    const updatedDefect = await prisma.defect.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title: title || defect.title,
        description: description !== undefined ? description : defect.description,
        stepsToReproduce:
          stepsToReproduce !== undefined
            ? stepsToReproduce
            : defect.stepsToReproduce,
        expectedBehavior:
          expectedBehavior !== undefined
            ? expectedBehavior
            : defect.expectedBehavior,
        actualBehavior:
          actualBehavior !== undefined ? actualBehavior : defect.actualBehavior,
        severity: severity || defect.severity,
        priority: priority || defect.priority,
        status: status || defect.status,
        assignedToId: assignedToId !== undefined ? assignedToId : defect.assignedToId,
        resolution: resolution !== undefined ? resolution : defect.resolution,
        resolvedAt:
          status === 'RESOLVED' || status === 'CLOSED'
            ? new Date()
            : defect.resolvedAt,
      },
      include: {
        reportedBy: {
          select: { id: true, username: true, email: true },
        },
        assignedTo: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedDefect,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete defect
// @route   DELETE /api/defects/:id
// @access  Private (Admin, Test Manager)
export const deleteDefect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const defect = await prisma.defect.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!defect) {
      return res.status(404).json({
        success: false,
        error: 'Defect not found',
      });
    }

    await prisma.defect.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to defect
// @route   POST /api/defects/:id/comments
// @access  Private
export const addComment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const defectId = parseInt(req.params.id);
    const { content } = req.body;

    const defect = await prisma.defect.findUnique({
      where: { id: defectId },
    });

    if (!defect) {
      return res.status(404).json({
        success: false,
        error: 'Defect not found',
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId: req.user.id,
        defectId,
      },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get defect statistics
// @route   GET /api/projects/:projectId/defects/stats
// @access  Private
export const getDefectStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = parseInt(req.params.projectId);

    const defects = await prisma.defect.findMany({
      where: { projectId },
      select: { status: true, severity: true, priority: true },
    });

    const stats = {
      total: defects.length,
      byStatus: {
        open: defects.filter((d) => d.status === 'OPEN').length,
        inProgress: defects.filter((d) => d.status === 'IN_PROGRESS').length,
        resolved: defects.filter((d) => d.status === 'RESOLVED').length,
        closed: defects.filter((d) => d.status === 'CLOSED').length,
        reopened: defects.filter((d) => d.status === 'REOPENED').length,
      },
      bySeverity: {
        critical: defects.filter((d) => d.severity === 'CRITICAL').length,
        high: defects.filter((d) => d.severity === 'HIGH').length,
        medium: defects.filter((d) => d.severity === 'MEDIUM').length,
        low: defects.filter((d) => d.severity === 'LOW').length,
      },
      byPriority: {
        critical: defects.filter((d) => d.priority === 'CRITICAL').length,
        high: defects.filter((d) => d.priority === 'HIGH').length,
        medium: defects.filter((d) => d.priority === 'MEDIUM').length,
        low: defects.filter((d) => d.priority === 'LOW').length,
      },
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
