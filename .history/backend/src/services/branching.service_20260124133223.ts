import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateBranchRequest {
  testProjectId: string;
  name: string;
  description?: string;
  sourceBranch?: string;
  createdById: string;
}

interface MergeBranchRequest {
  branchId: string;
  targetBranch: string;
  mergedById: string;
  resolveConflicts?: boolean;
}

export class BranchingService {
  /**
   * Create a new test branch
   */
  async createBranch(data: CreateBranchRequest) {
    // Check if branch name already exists
    const existingBranch = await prisma.testBranch.findUnique({
      where: {
        testProjectId_name: {
          testProjectId: data.testProjectId,
          name: data.name,
        },
      },
    });

    if (existingBranch) {
      throw new Error('Branch with this name already exists');
    }

    // Create the branch
    const branch = await prisma.testBranch.create({
      data: {
        testProjectId: data.testProjectId,
        name: data.name,
        description: data.description,
        sourceBranch: data.sourceBranch || null,
        status: 'ACTIVE',
        createdById: data.createdById,
      },
    });

    // If source branch is specified, copy test cases from it
    if (data.sourceBranch) {
      await this.copyTestCasesFromBranch(
        branch.id,
        data.testProjectId,
        data.sourceBranch
      );
    }

    return branch;
  }

  /**
   * List all branches for a project
   */
  async listBranches(testProjectId: string) {
    return await prisma.testBranch.findMany({
      where: { testProjectId },
      orderBy: { createdAt: 'desc' },
      include: {
        branchTests: {
          select: {
            testCaseId: true,
            action: true,
          },
        },
      },
    });
  }

  /**
   * Get branch details
   */
  async getBranch(branchId: string) {
    const branch = await prisma.testBranch.findUnique({
      where: { id: branchId },
      include: {
        branchTests: {
          include: {
            // Would include actual test case data
          },
        },
      },
    });

    if (!branch) {
      throw new Error('Branch not found');
    }

    return branch;
  }

  /**
   * Add or modify test case in branch
   */
  async modifyTestInBranch(
    branchId: string,
    testCaseId: string,
    action: 'ADDED' | 'MODIFIED' | 'DELETED',
    previousVersion?: any
  ) {
    const branch = await prisma.testBranch.findUnique({
      where: { id: branchId },
    });

    if (!branch || branch.status !== 'ACTIVE') {
      throw new Error('Branch is not active or does not exist');
    }

    // Check if test case already exists in branch
    const existing = await prisma.testCaseBranch.findUnique({
      where: {
        testBranchId_testCaseId: {
          testBranchId: branchId,
          testCaseId,
        },
      },
    });

    if (existing) {
      // Update existing entry
      return await prisma.testCaseBranch.update({
        where: { id: existing.id },
        data: {
          action,
          previousVersion: previousVersion || existing.previousVersion,
        },
      });
    } else {
      // Create new entry
      return await prisma.testCaseBranch.create({
        data: {
          testBranchId: branchId,
          testCaseId,
          action,
          previousVersion,
        },
      });
    }
  }

  /**
   * Merge branch into target branch
   */
  async mergeBranch(data: MergeBranchRequest) {
    const branch = await prisma.testBranch.findUnique({
      where: { id: data.branchId },
      include: {
        branchTests: true,
      },
    });

    if (!branch) {
      throw new Error('Branch not found');
    }

    if (branch.status !== 'ACTIVE') {
      throw new Error('Branch is not active');
    }

    // Get conflicts if any
    const conflicts = await this.detectConflicts(
      data.branchId,
      data.targetBranch
    );

    if (conflicts.length > 0 && !data.resolveConflicts) {
      throw new Error(
        `Merge conflicts detected. Please resolve conflicts first: ${conflicts.length} conflicts found`
      );
    }

    // Apply changes from branch to target
    const mergeResults = await this.applyBranchChanges(
      branch,
      data.targetBranch
    );

    // Mark branch as merged
    await prisma.testBranch.update({
      where: { id: data.branchId },
      data: {
        status: 'MERGED',
        mergedAt: new Date(),
        mergedById: data.mergedById,
      },
    });

    return {
      success: true,
      branch,
      mergeResults,
      conflicts: conflicts.length,
    };
  }

  /**
   * Delete a branch
   */
  async deleteBranch(branchId: string, userId: string) {
    const branch = await prisma.testBranch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      throw new Error('Branch not found');
    }

    // Mark as deleted instead of actually deleting
    await prisma.testBranch.update({
      where: { id: branchId },
      data: {
        status: 'DELETED',
        updatedAt: new Date(),
      },
    });

    return { success: true, message: 'Branch deleted successfully' };
  }

  /**
   * Compare two branches
   */
  async compareBranches(branchId1: string, branchId2: string) {
    const branch1Tests = await prisma.testCaseBranch.findMany({
      where: { testBranchId: branchId1 },
    });

    const branch2Tests = await prisma.testCaseBranch.findMany({
      where: { testBranchId: branchId2 },
    });

    const branch1TestIds = new Set(branch1Tests.map((t) => t.testCaseId));
    const branch2TestIds = new Set(branch2Tests.map((t) => t.testCaseId));

    const onlyInBranch1 = branch1Tests.filter(
      (t) => !branch2TestIds.has(t.testCaseId)
    );
    const onlyInBranch2 = branch2Tests.filter(
      (t) => !branch1TestIds.has(t.testCaseId)
    );
    const inBoth = branch1Tests.filter((t) =>
      branch2TestIds.has(t.testCaseId)
    );

    return {
      onlyInBranch1: onlyInBranch1.length,
      onlyInBranch2: onlyInBranch2.length,
      inBoth: inBoth.length,
      differences: {
        branch1Only: onlyInBranch1,
        branch2Only: onlyInBranch2,
        shared: inBoth,
      },
    };
  }

  // Private helper methods

  private async copyTestCasesFromBranch(
    targetBranchId: string,
    testProjectId: string,
    sourceBranchName: string
  ) {
    const sourceBranch = await prisma.testBranch.findUnique({
      where: {
        testProjectId_name: {
          testProjectId,
          name: sourceBranchName,
        },
      },
      include: {
        branchTests: true,
      },
    });

    if (sourceBranch) {
      // Copy all test cases from source branch
      await Promise.all(
        sourceBranch.branchTests.map((test) =>
          prisma.testCaseBranch.create({
            data: {
              testBranchId: targetBranchId,
              testCaseId: test.testCaseId,
              action: test.action,
              previousVersion: test.previousVersion,
            },
          })
        )
      );
    }
  }

  private async detectConflicts(
    branchId: string,
    targetBranch: string
  ): Promise<any[]> {
    // Simplified conflict detection
    // In production, this would check for overlapping modifications
    const branchTests = await prisma.testCaseBranch.findMany({
      where: { testBranchId: branchId },
    });

    // Would check if same tests were modified in target branch
    const conflicts: any[] = [];

    return conflicts;
  }

  private async applyBranchChanges(branch: any, targetBranch: string) {
    const results = {
      added: 0,
      modified: 0,
      deleted: 0,
      skipped: 0,
    };

    for (const branchTest of branch.branchTests) {
      try {
        switch (branchTest.action) {
          case 'ADDED':
            // In production, would actually create/update test cases
            results.added++;
            break;
          case 'MODIFIED':
            results.modified++;
            break;
          case 'DELETED':
            results.deleted++;
            break;
        }
      } catch (error) {
        results.skipped++;
      }
    }

    return results;
  }
}

export default new BranchingService();
