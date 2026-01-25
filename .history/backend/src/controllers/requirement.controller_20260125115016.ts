import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// @desc    Get all requirements
// @route   GET /api/projects/:projectId/requirements
// @access  Private
export const getRequirements = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;
    const { specId, status } = req.query;

    const where: any = { testProjectId: projectId };
    if (specId) {
      where.requirementSpecId = specId as string;
    }
    if (status) {
      where.status = status;
    }

    const requirements = await prisma.requirement.findMany({
      where,
      include: {
        requirementSpec: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, username: true, email: true },
        },
        _count: {
          select: { testCases: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: requirements.length,
      data: requirements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single requirement
// @route   GET /api/requirements/:id
// @access  Private
export const getRequirement = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const requirement = await prisma.requirement.findUnique({
      where: { id: req.params.id },
      include: {
        requirementSpec: true,
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
        createdBy: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    if (!requirement) {
      return res.status(404).json({
        success: false,
        error: 'Requirement not found',
      });
    }

    res.status(200).json({
      success: true,
      data: requirement,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create requirement
// @route   POST /api/projects/:projectId/requirements
// @access  Private (Admin, Test Manager)
export const createRequirement = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;
    const {
      requirementSpecId,
      title,
      description,
      externalId,
      status,
      priority,
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

    // Get or create default requirement spec
    let finalRequirementSpecId = requirementSpecId;
    
    if (!finalRequirementSpecId) {
      // Find or create a default requirement spec for this project
      let defaultSpec = await prisma.requirementSpec.findFirst({
        where: { 
          testProjectId: projectId,
          name: 'Default Requirements'
        },
      });

      if (!defaultSpec) {
        defaultSpec = await prisma.requirementSpec.create({
          data: {
            name: 'Default Requirements',
            description: 'Default requirement specification',
            testProjectId: projectId,
          },
        });
      }

      finalRequirementSpecId = defaultSpec.id;
    } else {
      // Verify requirement spec if provided
      const spec = await prisma.requirementSpec.findUnique({
        where: { id: requirementSpecId },
      });

      if (!spec || spec.testProjectId !== projectId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid requirement specification',
        });
      }
    }

    // Generate external ID if not provided
    let finalExternalId = externalId;
    if (!finalExternalId) {
      const reqCount = await prisma.requirement.count({
        where: { testProjectId: projectId }
      });
      finalExternalId = `${project.prefix}-REQ-${reqCount + 1}`;
    }

    const requirement = await prisma.requirement.create({
      data: {
        testProjectId: projectId,
        requirementSpecId: finalRequirementSpecId,
        title,
        description,
        externalId: finalExternalId,
        status: status || 'DRAFT',
        priority: priority || 'MEDIUM',
        version: 1,
        createdById: req.user!.id,
      },
      include: {
        requirementSpec: {
          select: { id: true, name: true },
        },
        createdBy: {
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
              jiraIssueType: 'Story',
              jiraIssueSummary: requirement.title,
              jiraIssueStatus: 'Open',
              entityType: 'TEST_PLAN',
              entityId: requirement.id,
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
      data: requirement,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update requirement
// @route   PUT /api/requirements/:id
// @access  Private (Admin, Test Manager)
export const updateRequirement = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, description, status, priority } = req.body;

    const requirement = await prisma.requirement.findUnique({
      where: { id: req.params.id },
    });

    if (!requirement) {
      return res.status(404).json({
        success: false,
        error: 'Requirement not found',
      });
    }

    const updatedRequirement = await prisma.requirement.update({
      where: { id: req.params.id },
      data: {
        title: title || requirement.title,
        description: description !== undefined ? description : requirement.description,
        status: status || requirement.status,
        priority: priority || requirement.priority,
      },
      include: {
        requirementSpec: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedRequirement,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete requirement
// @route   DELETE /api/requirements/:id
// @access  Private (Admin)
export const deleteRequirement = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const requirement = await prisma.requirement.findUnique({
      where: { id: req.params.id },
    });

    if (!requirement) {
      return res.status(404).json({
        success: false,
        error: 'Requirement not found',
      });
    }

    await prisma.requirement.delete({
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

// @desc    Link test case to requirement
// @route   POST /api/requirements/:id/test-cases
// @access  Private (Admin, Test Manager, Tester)
export const linkTestCase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const requirementId = req.params.id;
    const { testCaseId } = req.body as { testCaseId: string };

    // Check if already linked
    const existing = await prisma.testCaseRequirement.findUnique({
      where: {
        testCaseId_requirementId: {
          testCaseId,
          requirementId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Test case already linked to this requirement',
      });
    }

    const link = await prisma.testCaseRequirement.create({
      data: {
        testCaseId,
        requirementId,
      },
      include: {
        testCase: {
          select: { id: true, externalId: true, name: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: link,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create requirement spec
// @route   POST /api/projects/:projectId/requirement-specs
// @access  Private (Admin, Test Manager)
export const createRequirementSpec = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;
    const { name, description } = req.body;

    const spec = await prisma.requirementSpec.create({
      data: {
        testProjectId: projectId,
        name,
        description,
      },
    });

    res.status(201).json({
      success: true,
      data: spec,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get requirement specs
// @route   GET /api/projects/:projectId/requirement-specs
// @access  Private
export const getRequirementSpecs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;

    const specs = await prisma.requirementSpec.findMany({
      where: { testProjectId: projectId },
      include: {
        _count: {
          select: { requirements: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: specs.length,
      data: specs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get requirements coverage statistics
// @route   GET /api/requirements/coverage
// @access  Private
export const getRequirementsCoverage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.query.projectId as string;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required',
      });
    }

    // Get total requirements
    const totalRequirements = await prisma.requirement.count({
      where: { testProjectId: projectId },
    });

    // Get covered requirements (those with test case links)
    const coveredRequirements = await prisma.requirement.count({
      where: {
        testProjectId: projectId,
        testCases: {
          some: {},
        },
      },
    });

    const coverage = totalRequirements > 0 
      ? ((coveredRequirements / totalRequirements) * 100).toFixed(2)
      : '0.00';

    res.status(200).json({
      success: true,
      data: {
        total: totalRequirements,
        covered: coveredRequirements,
        uncovered: totalRequirements - coveredRequirements,
        coveragePercentage: parseFloat(coverage),
      },
    });
  } catch (error) {
    next(error);
  }
};
