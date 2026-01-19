import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SharedStepService {
  /**
   * Create a shared step
   */
  static async createSharedStep(data: {
    name: string;
    description?: string;
    testProjectId: string;
    stepNumber: number;
    action: string;
    expectedResult: string;
    testData?: string;
    createdById: string;
  }) {
    return await prisma.sharedStep.create({
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Get shared steps for a project
   */
  static async getProjectSharedSteps(testProjectId: string, isActive?: boolean) {
    const where: any = { testProjectId };
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return await prisma.sharedStep.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        usedInCases: {
          select: {
            testCaseId: true,
          },
        },
      },
    });
  }

  /**
   * Get shared step by ID
   */
  static async getSharedStepById(id: string) {
    return await prisma.sharedStep.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        usedInCases: {
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
      },
    });
  }

  /**
   * Update shared step
   */
  static async updateSharedStep(
    id: string,
    data: {
      name?: string;
      description?: string;
      action?: string;
      expectedResult?: string;
      testData?: string;
      isActive?: boolean;
    }
  ) {
    // Increment version when updating
    const current = await prisma.sharedStep.findUnique({ where: { id } });
    
    return await prisma.sharedStep.update({
      where: { id },
      data: {
        ...data,
        version: current ? current.version + 1 : 1,
      },
    });
  }

  /**
   * Delete shared step
   */
  static async deleteSharedStep(id: string) {
    // First check if it's used in any test cases
    const usageCount = await prisma.sharedStepLink.count({
      where: { sharedStepId: id },
    });

    if (usageCount > 0) {
      // Soft delete by marking as inactive
      return await prisma.sharedStep.update({
        where: { id },
        data: { isActive: false },
      });
    }

    // Hard delete if not used
    return await prisma.sharedStep.delete({
      where: { id },
    });
  }

  /**
   * Link shared step to test case
   */
  static async linkToTestCase(testCaseId: string, sharedStepId: string, orderIndex: number) {
    return await prisma.sharedStepLink.create({
      data: {
        testCaseId,
        sharedStepId,
        orderIndex,
      },
    });
  }

  /**
   * Unlink shared step from test case
   */
  static async unlinkFromTestCase(testCaseId: string, sharedStepId: string) {
    return await prisma.sharedStepLink.deleteMany({
      where: {
        testCaseId,
        sharedStepId,
      },
    });
  }

  /**
   * Get test cases using a shared step
   */
  static async getUsageCount(sharedStepId: string) {
    const count = await prisma.sharedStepLink.count({
      where: { sharedStepId },
    });

    const testCases = await prisma.sharedStepLink.findMany({
      where: { sharedStepId },
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
    });

    return {
      count,
      testCases,
    };
  }

  /**
   * Get shared steps for a test case
   */
  static async getTestCaseSharedSteps(testCaseId: string) {
    return await prisma.sharedStepLink.findMany({
      where: { testCaseId },
      orderBy: { orderIndex: 'asc' },
      include: {
        sharedStep: true,
      },
    });
  }
}

export default SharedStepService;
