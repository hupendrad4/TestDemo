import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SearchService {
  /**
   * Global search across multiple entities
   */
  static async globalSearch(query: string, projectId?: string, limit: number = 20) {
    const searchTerm = `%${query}%`;
    const results: any = {
      testCases: [],
      testSuites: [],
      requirements: [],
      testPlans: [],
      testRuns: [],
      defects: [],
    };

    const baseWhere: any = {};
    if (projectId) {
      baseWhere.testProjectId = projectId;
    }

    // Search test cases
    results.testCases = await prisma.testCase.findMany({
      where: {
        ...baseWhere,
        OR: [
          { externalId: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { summary: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        externalId: true,
        name: true,
        status: true,
        priority: true,
        testSuite: {
          select: {
            name: true,
          },
        },
      },
    });

    // Search test suites
    results.testSuites = await prisma.testSuite.findMany({
      where: {
        ...baseWhere,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        testProject: {
          select: {
            name: true,
          },
        },
      },
    });

    // Search requirements
    results.requirements = await prisma.requirement.findMany({
      where: {
        ...baseWhere,
        OR: [
          { externalId: { contains: query, mode: 'insensitive' } },
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        externalId: true,
        title: true,
        status: true,
        priority: true,
      },
    });

    // Search test plans
    results.testPlans = await prisma.testPlan.findMany({
      where: {
        ...baseWhere,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        testProject: {
          select: {
            name: true,
          },
        },
      },
    });

    // Search test runs
    results.testRuns = await prisma.testRun.findMany({
      where: {
        testPlan: {
          testProjectId: projectId,
        },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        testPlan: {
          select: {
            name: true,
          },
        },
      },
    });

    // Search defects
    results.defects = await prisma.defect.findMany({
      where: {
        OR: [
          { externalId: { contains: query, mode: 'insensitive' } },
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        externalId: true,
        title: true,
        status: true,
        severity: true,
        priority: true,
      },
    });

    return results;
  }

  /**
   * Search test cases with advanced filters
   */
  static async searchTestCases(filters: {
    projectId?: string;
    query?: string;
    status?: string[];
    priority?: string[];
    executionType?: string[];
    suiteId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.projectId) {
      where.testSuite = {
        testProjectId: filters.projectId,
      };
    }

    if (filters.query) {
      where.OR = [
        { externalId: { contains: filters.query, mode: 'insensitive' } },
        { name: { contains: filters.query, mode: 'insensitive' } },
        { summary: { contains: filters.query, mode: 'insensitive' } },
      ];
    }

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters.priority && filters.priority.length > 0) {
      where.priority = { in: filters.priority };
    }

    if (filters.executionType && filters.executionType.length > 0) {
      where.executionType = { in: filters.executionType };
    }

    if (filters.suiteId) {
      where.testSuiteId = filters.suiteId;
    }

    const [testCases, total] = await Promise.all([
      prisma.testCase.findMany({
        where,
        skip: filters.offset || 0,
        take: filters.limit || 50,
        orderBy: { createdAt: 'desc' },
        include: {
          testSuite: {
            select: {
              id: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.testCase.count({ where }),
    ]);

    return {
      testCases,
      total,
      page: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
      pageSize: filters.limit || 50,
    };
  }

  /**
   * Quick search for autocomplete
   */
  static async quickSearch(query: string, entityType: string, projectId?: string, limit: number = 10) {
    const searchTerm = `%${query}%`;

    switch (entityType) {
      case 'testCase':
        return await prisma.testCase.findMany({
          where: {
            ...(projectId && {
              testSuite: {
                testProjectId: projectId,
              },
            }),
            OR: [
              { externalId: { contains: query, mode: 'insensitive' } },
              { name: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: limit,
          select: {
            id: true,
            externalId: true,
            name: true,
          },
        });

      case 'requirement':
        return await prisma.requirement.findMany({
          where: {
            ...(projectId && { testProjectId: projectId }),
            OR: [
              { externalId: { contains: query, mode: 'insensitive' } },
              { title: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: limit,
          select: {
            id: true,
            externalId: true,
            title: true,
          },
        });

      case 'user':
        return await prisma.user.findMany({
          where: {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
            ],
            isActive: true,
          },
          take: limit,
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        });

      default:
        return [];
    }
  }
}

export default SearchService;
