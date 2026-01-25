import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Generate public report link
export const generatePublicReportLink = async (req: Request, res: Response) => {
  try {
    const { testRunId } = req.body;
    const userId = (req as any).userId;

    // Verify test run exists and user has access
    const testRun = await prisma.testRun.findFirst({
      where: {
        id: testRunId,
        testPlan: {
          testProject: {
            members: {
              some: { userId }
            }
          }
        }
      }
    });

    if (!testRun) {
      return res.status(404).json({ message: 'Test run not found' });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    // Create public link
    const publicLink = await prisma.publicReportLink.create({
      data: {
        token,
        testRunId,
        createdById: userId,
        expiresAt,
        isActive: true
      }
    });

    res.json({
      token: publicLink.token,
      url: `${process.env.FRONTEND_URL || 'http://localhost:3002'}/public/report/${token}`,
      expiresAt: publicLink.expiresAt
    });
  } catch (error) {
    console.error('Error generating public link:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get public report (no auth required)
export const getPublicReport = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const publicLink = await prisma.publicReportLink.findUnique({
      where: { token }
    });

    if (!publicLink) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (!publicLink.isActive) {
      return res.status(403).json({ message: 'This report link has been deactivated' });
    }

    if (publicLink.expiresAt && new Date() > publicLink.expiresAt) {
      return res.status(410).json({ message: 'This report link has expired' });
    }

    // Fetch test run details separately
    const testRun = await prisma.testRun.findUnique({
      where: { id: publicLink.testRunId },
      include: {
        testPlan: {
          select: {
            id: true,
            name: true,
            description: true,
            testProject: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!testRun) {
      return res.status(404).json({ message: 'Test run not found' });
    }

    // Fetch executions - using testCycleId since executions belong to cycles
    const testCycles = await prisma.testCycle.findMany({
      where: { 
        testRuns: {
          some: {
            id: publicLink.testRunId
          }
        }
      },
      select: { id: true }
    });

    const cycleIds = testCycles.map(c => c.id);
    const executions = await prisma.testExecution.findMany({
      where: { testCycleId: { in: cycleIds } },
      include: {
        testCase: {
          select: {
            id: true,
            externalId: true,
            name: true,
            priority: true,
            executionType: true
          }
        },
        executedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Increment view count
    await prisma.publicReportLink.update({
      where: { id: publicLink.id },
      data: { viewCount: { increment: 1 } }
    });

    // Calculate report statistics
    const totalTests = executions.length;
    const passed = executions.filter(e => e.status === 'PASSED').length;
    const failed = executions.filter(e => e.status === 'FAILED').length;
    const skipped = executions.filter(e => e.status === 'SKIPPED').length;
    const blocked = executions.filter(e => e.status === 'BLOCKED').length;

    res.json({
      report: {
        testRun: {
          ...testRun,
          executions
        },
        stats: {
          total: totalTests,
          passed,
          failed,
          skipped,
          blocked,
          passRate: totalTests > 0 ? ((passed / totalTests) * 100).toFixed(2) : 0
        }
      },
      linkInfo: {
        createdAt: publicLink.createdAt,
        expiresAt: publicLink.expiresAt,
        viewCount: publicLink.viewCount
      }
    });
  } catch (error) {
    console.error('Error fetching public report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// List public links for a test run
export const getPublicLinks = async (req: Request, res: Response) => {
  try {
    const { testRunId } = req.params;
    const userId = (req as any).userId;

    // Verify access
    const testRun = await prisma.testRun.findFirst({
      where: {
        id: testRunId,
        testPlan: {
          testProject: {
            members: {
              some: { userId }
            }
          }
        }
      }
    });

    if (!testRun) {
      return res.status(404).json({ message: 'Test run not found' });
    }

    const links = await prisma.publicReportLink.findMany({
      where: { testRunId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(links);
  } catch (error) {
    console.error('Error fetching public links:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Deactivate public link
export const deactivatePublicLink = async (req: Request, res: Response) => {
  try {
    const { linkId } = req.params;
    const userId = (req as any).userId;

    const link = await prisma.publicReportLink.findFirst({
      where: {
        id: linkId,
        testRun: {
          testPlan: {
            testProject: {
              members: {
                some: { userId }
              }
            }
          }
        }
      }
    });

    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    await prisma.publicReportLink.update({
      where: { id: linkId },
      data: { isActive: false }
    });

    res.json({ message: 'Link deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating link:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
