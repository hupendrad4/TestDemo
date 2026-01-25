import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// @desc    Get all test cases
// @route   GET /api/projects/:projectId/test-cases
// @access  Private
export const getTestCases = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;
    const { suiteId, status, priority } = req.query;

    const where: any = {
      testSuite: { testProjectId: projectId }
    };
    
    if (suiteId) {
      where.testSuiteId = suiteId as string;
    }
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }

    const testCases = await prisma.testCase.findMany({
      where,
      include: {
        testSuite: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, username: true, email: true },
        },
        _count: {
          select: { steps: true, executions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: testCases.length,
      data: testCases,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single test case
// @route   GET /api/test-cases/:id
// @access  Private
export const getTestCase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const testCase = await prisma.testCase.findUnique({
      where: { id: req.params.id },
      include: {
        testSuite: {
          select: { id: true, name: true },
        },
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        keywords: {
          include: {
            keyword: true,
          },
        },
        requirements: {
          include: {
            requirement: {
              select: { id: true, title: true, externalId: true },
            },
          },
        },
        createdBy: {
          select: { id: true, username: true, email: true },
        },
        attachments: true,
      },
    });

    if (!testCase) {
      return res.status(404).json({
        success: false,
        error: 'Test case not found',
      });
    }

    res.status(200).json({
      success: true,
      data: testCase,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create test case
// @route   POST /api/projects/:projectId/test-cases
// @access  Private (Admin, Test Manager, Tester)
export const createTestCase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    const {
      testSuiteId,
      name,
      title,
      summary,
      description,
      preconditions,
      expectedBehavior,
      actualBehavior,
      executionType,
      status,
      priority,
      type,
      estimatedTime,
      testSteps,
      steps,
      format,
      gherkinScenario,
      jiraIssueKey,
    } = req.body;

    // Handle field aliases (frontend might send 'title' or 'name', 'description' or 'summary')
    const finalName = name || title || 'Untitled Test Case';
    const finalSummary = summary || description;
    const finalFormat = format || 'TRADITIONAL';

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

    // Get or create default test suite if not provided
    let finalTestSuiteId = testSuiteId;
    
    if (!finalTestSuiteId) {
      let defaultSuite = await prisma.testSuite.findFirst({
        where: { 
          testProjectId: projectId,
          name: 'Default Test Suite'
        },
      });

      if (!defaultSuite) {
        defaultSuite = await prisma.testSuite.create({
          data: {
            name: 'Default Test Suite',
            description: 'Default test suite for uncategorized test cases',
            testProjectId: projectId,
          },
        });
      }

      finalTestSuiteId = defaultSuite.id;
    } else {
      // Verify test suite exists and belongs to project
      const testSuite = await prisma.testSuite.findUnique({
        where: { id: testSuiteId },
      });

      if (!testSuite || testSuite.testProjectId !== projectId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid test suite',
        });
      }
    }

    // Generate external ID based on count within project
    const caseCount = await prisma.testCase.count({
      where: { testSuite: { testProjectId: projectId } }
    });
    const externalId = `${project!.prefix}-${caseCount + 1}`;

    // Auto-create a default step if expectedBehavior provided but no steps
    const finalSteps = testSteps || steps;
    let stepsToCreate = finalSteps;
    
    if (!stepsToCreate && expectedBehavior) {
      stepsToCreate = [{
        action: 'Execute test case',
        expectedResult: expectedBehavior,
        testData: actualBehavior || null,
      }];
    }

    // Create test case with steps
    const testCase = await prisma.testCase.create({
      data: {
        testSuiteId: finalTestSuiteId,
        externalId,
        name: finalName,
        summary: finalSummary,
        preconditions,
        executionType: executionType || 'MANUAL',
        status: status || 'DRAFT',
        priority: priority || 'MEDIUM',
        estimatedTime,
        format: finalFormat,
        gherkinScenario: finalFormat === 'BDD' ? gherkinScenario : null,
        version: 1,
        createdById: req.user.id,
        steps: stepsToCreate && finalFormat === 'TRADITIONAL'
          ? {
              create: stepsToCreate.map((step: any, index: number) => ({
                stepNumber: index + 1,
                action: step.action || step.description || 'Execute step',
                expectedResult: step.expectedResult || step.expected || '',
                testData: step.testData || step.data,
              })),
            }
          : undefined,
      },
      include: {
        testSuite: {
          select: { id: true, name: true },
        },
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        createdBy: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    // Create Jira link if jiraIssueKey is provided
    if (jiraIssueKey && jiraIssueKey.trim()) {
      try {
        // Get Jira integration for this project
        const jiraIntegration = await prisma.jiraIntegration.findUnique({
          where: { testProjectId: projectId },
        });

        if (jiraIntegration && jiraIntegration.isActive) {
          // Extract the Jira issue details (in real implementation, you would fetch from Jira API)
          const jiraProjectKey = jiraIssueKey.split('-')[0];
          
          // Find or create Jira project
          let jiraProject = await prisma.jiraProject.findFirst({
            where: { 
              jiraIntegrationId: jiraIntegration.id,
              jiraProjectKey: jiraProjectKey
            },
          });

          if (!jiraProject) {
            // Create a placeholder Jira project (in real scenario, fetch from Jira API)
            jiraProject = await prisma.jiraProject.create({
              data: {
                jiraIntegrationId: jiraIntegration.id,
                jiraProjectKey: jiraProjectKey,
                jiraProjectId: jiraProjectKey, // Placeholder
                jiraProjectName: jiraProjectKey, // Placeholder
              },
            });
          }

          // Create Jira link
          await prisma.jiraLink.create({
            data: {
              jiraIntegrationId: jiraIntegration.id,
              jiraProjectId: jiraProject.id,
              jiraIssueKey: jiraIssueKey.toUpperCase(),
              jiraIssueId: jiraIssueKey, // Placeholder (should be fetched from Jira)
              jiraIssueType: 'Story', // Placeholder
              jiraIssueSummary: testCase.name, // Placeholder
              jiraIssueStatus: 'Open', // Placeholder
              entityType: 'TEST_CASE',
              entityId: testCase.id,
              syncStatus: 'PENDING',
            },
          });
        }
      } catch (jiraError) {
        // Log the error but don't fail the test case creation
        console.error('Failed to create Jira link:', jiraError);
      }
    }

    res.status(201).json({
      success: true,
      data: testCase,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update test case
// @route   PUT /api/test-cases/:id
// @access  Private (Admin, Test Manager, Tester)
export const updateTestCase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      summary,
      preconditions,
      status,
      priority,
      estimatedTime,
      testSteps,
    } = req.body;

    const testCase = await prisma.testCase.findUnique({
      where: { id: req.params.id },
      include: { steps: true },
    });

    if (!testCase) {
      return res.status(404).json({
        success: false,
        error: 'Test case not found',
      });
    }

    // If test steps are being updated, delete old ones and create new ones
    if (testSteps) {
      await prisma.testStep.deleteMany({
        where: { testCaseId: testCase.id },
      });
    }

    const updatedTestCase = await prisma.testCase.update({
      where: { id: req.params.id },
      data: {
        name: name || testCase.name,
        summary: summary !== undefined ? summary : testCase.summary,
        preconditions: preconditions !== undefined ? preconditions : testCase.preconditions,
        status: status || testCase.status,
        priority: priority || testCase.priority,
        estimatedTime: estimatedTime !== undefined ? estimatedTime : testCase.estimatedTime,
        version: testSteps ? testCase.version + 1 : testCase.version,
        steps: testSteps
          ? {
              create: testSteps.map((step: any, index: number) => ({
                stepNumber: index + 1,
                action: step.action,
                expectedResult: step.expectedResult,
                testData: step.testData,
              })),
            }
          : undefined,
      },
      include: {
        testSuite: {
          select: { id: true, name: true },
        },
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        createdBy: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedTestCase,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete test case
// @route   DELETE /api/test-cases/:id
// @access  Private (Admin, Test Manager)
export const deleteTestCase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const testCase = await prisma.testCase.findUnique({
      where: { id: req.params.id },
    });

    if (!testCase) {
      return res.status(404).json({
        success: false,
        error: 'Test case not found',
      });
    }

    await prisma.testCase.delete({
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

// @desc    Get test cases by project (alternative route)
// @route   GET /api/test-cases/projects/:projectId
// @access  Private
export const getTestCasesByProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId;
    const { suiteId, status, priority } = req.query;

    const where: any = {
      testSuite: { testProjectId: projectId }
    };
    
    if (suiteId) {
      where.testSuiteId = suiteId as string;
    }
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }

    const testCases = await prisma.testCase.findMany({
      where,
      include: {
        testSuite: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, username: true, email: true },
        },
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        _count: {
          select: { steps: true, executions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: testCases.length,
      data: testCases,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add test steps to a test case
// @route   POST /api/test-cases/:id/steps
// @access  Private
export const addTestSteps = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const testCaseId = req.params.id;
    const { steps } = req.body;

    // Verify test case exists
    const testCase = await prisma.testCase.findUnique({
      where: { id: testCaseId },
    });

    if (!testCase) {
      return res.status(404).json({
        success: false,
        error: 'Test case not found',
      });
    }

    // Delete existing steps if any
    await prisma.testStep.deleteMany({
      where: { testCaseId },
    });

    // Create new steps
    if (steps && steps.length > 0) {
      await prisma.testStep.createMany({
        data: steps.map((step: any, index: number) => ({
          testCaseId,
          stepNumber: index + 1,
          action: step.action || step.description,
          expectedResult: step.expectedResult,
          testData: step.testData,
        })),
      });
    }

    // Fetch updated test case with steps
    const updatedTestCase = await prisma.testCase.findUnique({
      where: { id: testCaseId },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedTestCase,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk update test cases
// @route   PUT /api/test-cases/bulk-update
// @access  Private (Admin, Test Manager, Tester)
export const bulkUpdateTestCases = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { testCaseIds, updates } = req.body;

    if (!testCaseIds || !Array.isArray(testCaseIds) || testCaseIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'testCaseIds array is required',
      });
    }

    // Build update data object
    const updateData: any = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.priority) updateData.priority = updates.priority;
    if (updates.executionType) updateData.executionType = updates.executionType;

    // Perform bulk update
    const result = await prisma.testCase.updateMany({
      where: {
        id: { in: testCaseIds },
      },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: `Updated ${result.count} test cases`,
      count: result.count,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk delete test cases
// @route   DELETE /api/test-cases/bulk-delete
// @access  Private (Admin, Test Manager)
export const bulkDeleteTestCases = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { testCaseIds } = req.body;

    if (!testCaseIds || !Array.isArray(testCaseIds) || testCaseIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'testCaseIds array is required',
      });
    }

    // Delete test cases (cascade will handle steps)
    const result = await prisma.testCase.deleteMany({
      where: {
        id: { in: testCaseIds },
      },
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.count} test cases`,
      count: result.count,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk move test cases to different suite
// @route   PUT /api/test-cases/bulk-move
// @access  Private (Admin, Test Manager, Tester)
export const bulkMoveTestCases = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { testCaseIds, targetSuiteId } = req.body;

    if (!testCaseIds || !Array.isArray(testCaseIds) || testCaseIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'testCaseIds array is required',
      });
    }

    if (!targetSuiteId) {
      return res.status(400).json({
        success: false,
        error: 'targetSuiteId is required',
      });
    }

    // Verify target suite exists
    const targetSuite = await prisma.testSuite.findUnique({
      where: { id: targetSuiteId },
    });

    if (!targetSuite) {
      return res.status(404).json({
        success: false,
        error: 'Target suite not found',
      });
    }

    // Move test cases
    const result = await prisma.testCase.updateMany({
      where: {
        id: { in: testCaseIds },
      },
      data: {
        testSuiteId: targetSuiteId,
      },
    });

    res.status(200).json({
      success: true,
      message: `Moved ${result.count} test cases to suite: ${targetSuite.name}`,
      count: result.count,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export all test cases by project
// @route   GET /api/test-cases/export/all
// @access  Private
export const exportAllTestCases = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get all active projects with their test cases
    const projects = await prisma.testProject.findMany({
      where: { isActive: true },
      include: {
        testSuites: {
          include: {
            testCases: {
              include: {
                steps: {
                  orderBy: { stepNumber: 'asc' }
                },
                createdBy: {
                  select: { username: true, email: true }
                },
                testSuite: {
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    });

    // Create a temporary directory for CSV files
    const tempDir = path.join(__dirname, '..', '..', 'temp_exports');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    const exportDir = path.join(tempDir, `export_${timestamp}`);
    fs.mkdirSync(exportDir, { recursive: true });

    // Create CSV file for each project
    for (const project of projects) {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Test Cases');

      // Add headers
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 15 },
        { header: 'External ID', key: 'externalId', width: 15 },
        { header: 'Name', key: 'name', width: 40 },
        { header: 'Test Suite', key: 'testSuite', width: 25 },
        { header: 'Summary', key: 'summary', width: 50 },
        { header: 'Preconditions', key: 'preconditions', width: 40 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Priority', key: 'priority', width: 15 },
        { header: 'Execution Type', key: 'executionType', width: 15 },
        { header: 'Format', key: 'format', width: 15 },
        { header: 'Estimated Time (min)', key: 'estimatedTime', width: 15 },
        { header: 'Steps', key: 'steps', width: 60 },
        { header: 'Created By', key: 'createdBy', width: 20 },
        { header: 'Created At', key: 'createdAt', width: 20 },
      ];

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Collect all test cases from all suites
      const allTestCases: any[] = [];
      for (const suite of project.testSuites) {
        for (const testCase of suite.testCases) {
          allTestCases.push(testCase);
        }
      }

      // Add data rows
      for (const testCase of allTestCases) {
        const stepsText = testCase.steps
          .map((step: any) => `${step.stepNumber}. ${step.action} | Expected: ${step.expectedResult}`)
          .join('\\n');

        worksheet.addRow({
          id: testCase.id,
          externalId: testCase.externalId,
          name: testCase.name,
          testSuite: testCase.testSuite.name,
          summary: testCase.summary || '',
          preconditions: testCase.preconditions || '',
          status: testCase.status,
          priority: testCase.priority,
          executionType: testCase.executionType,
          format: testCase.format,
          estimatedTime: testCase.estimatedTime || '',
          steps: stepsText,
          createdBy: testCase.createdBy.username,
          createdAt: testCase.createdAt.toISOString().split('T')[0],
        });
      }

      // Save the CSV file
      const fileName = `${project.prefix}_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
      const filePath = path.join(exportDir, fileName);
      await workbook.csv.writeFile(filePath);
    }

    // Create a zip file
    const zipFileName = `testcases_export_${timestamp}.zip`;
    const zipFilePath = path.join(tempDir, zipFileName);
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Handle archiver events
    output.on('close', () => {
      // Send the zip file
      res.download(zipFilePath, zipFileName, (err) => {
        // Cleanup
        fs.rmSync(exportDir, { recursive: true, force: true });
        fs.unlinkSync(zipFilePath);
        if (err) next(err);
      });
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(output);
    archive.directory(exportDir, false);
    archive.finalize();

  } catch (error) {
    next(error);
  }
};
