import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

interface CreateFeatureRequest {
  testProjectId: string;
  name: string;
  description?: string;
  tags?: string[];
  filePath?: string;
}

interface CreateScenarioRequest {
  featureId: string;
  name: string;
  description?: string;
  type?: 'SCENARIO' | 'SCENARIO_OUTLINE' | 'BACKGROUND';
  tags?: string[];
  steps: Array<{
    keyword: 'GIVEN' | 'WHEN' | 'THEN' | 'AND' | 'BUT';
    text: string;
    docString?: string;
    dataTable?: any;
  }>;
}

export class GherkinService {
  /**
   * Create a new Gherkin feature
   */
  async createFeature(data: CreateFeatureRequest) {
    const feature = await prisma.gherkinFeature.create({
      data: {
        testProjectId: data.testProjectId,
        name: data.name,
        description: data.description,
        filePath: data.filePath,
        tags: data.tags || [],
      },
    });

    return feature;
  }

  /**
   * Create a new scenario within a feature
   */
  async createScenario(data: CreateScenarioRequest) {
    const scenario = await prisma.gherkinScenario.create({
      data: {
        featureId: data.featureId,
        name: data.name,
        description: data.description,
        type: data.type || 'SCENARIO',
        tags: data.tags || [],
      },
    });

    // Create steps for the scenario
    const steps = await Promise.all(
      data.steps.map((step, index) =>
        prisma.gherkinStep.create({
          data: {
            scenarioId: scenario.id,
            keyword: step.keyword,
            text: step.text,
            stepNumber: index + 1,
            docString: step.docString,
            dataTable: step.dataTable,
          },
        })
      )
    );

    return { ...scenario, steps };
  }

  /**
   * Parse Gherkin file and import to database
   */
  async importGherkinFile(testProjectId: string, filePath: string) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = this.parseGherkinContent(content);

      // Create feature
      const feature = await this.createFeature({
        testProjectId,
        name: parsed.feature.name,
        description: parsed.feature.description,
        tags: parsed.feature.tags,
        filePath,
      });

      // Create scenarios
      const scenarios = await Promise.all(
        parsed.scenarios.map((scenario) =>
          this.createScenario({
            featureId: feature.id,
            name: scenario.name,
            description: scenario.description,
            type: scenario.type,
            tags: scenario.tags,
            steps: scenario.steps,
          })
        )
      );

      return { feature, scenarios };
    } catch (error) {
      throw new Error(`Failed to import Gherkin file: ${error}`);
    }
  }

  /**
   * Export feature to Gherkin file format
   */
  async exportToGherkin(featureId: string): Promise<string> {
    const feature = await prisma.gherkinFeature.findUnique({
      where: { id: featureId },
      include: {
        scenarios: {
          include: {
            steps: {
              orderBy: { stepNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!feature) {
      throw new Error('Feature not found');
    }

    return this.generateGherkinContent(feature);
  }

  /**
   * List all features for a project
   */
  async listFeatures(testProjectId: string) {
    return await prisma.gherkinFeature.findMany({
      where: { testProjectId },
      include: {
        scenarios: {
          include: {
            steps: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get feature details
   */
  async getFeature(featureId: string) {
    const feature = await prisma.gherkinFeature.findUnique({
      where: { id: featureId },
      include: {
        scenarios: {
          include: {
            steps: {
              orderBy: { stepNumber: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!feature) {
      throw new Error('Feature not found');
    }

    return feature;
  }

  /**
   * Update feature
   */
  async updateFeature(
    featureId: string,
    updates: Partial<CreateFeatureRequest>
  ) {
    return await prisma.gherkinFeature.update({
      where: { id: featureId },
      data: {
        name: updates.name,
        description: updates.description,
        tags: updates.tags,
      },
    });
  }

  /**
   * Update scenario
   */
  async updateScenario(
    scenarioId: string,
    updates: Partial<CreateScenarioRequest>
  ) {
    const scenario = await prisma.gherkinScenario.update({
      where: { id: scenarioId },
      data: {
        name: updates.name,
        description: updates.description,
        type: updates.type,
        tags: updates.tags,
      },
    });

    // Update steps if provided
    if (updates.steps) {
      // Delete existing steps
      await prisma.gherkinStep.deleteMany({
        where: { scenarioId },
      });

      // Create new steps
      await Promise.all(
        updates.steps.map((step, index) =>
          prisma.gherkinStep.create({
            data: {
              scenarioId,
              keyword: step.keyword,
              text: step.text,
              stepNumber: index + 1,
              docString: step.docString,
              dataTable: step.dataTable,
            },
          })
        )
      );
    }

    return scenario;
  }

  /**
   * Delete feature
   */
  async deleteFeature(featureId: string) {
    await prisma.gherkinFeature.delete({
      where: { id: featureId },
    });

    return { success: true, message: 'Feature deleted successfully' };
  }

  /**
   * Convert test case to Gherkin scenario
   */
  async convertTestCaseToGherkin(testCaseId: string, featureId: string) {
    const testCase = await prisma.testCase.findUnique({
      where: { id: testCaseId },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    });

    if (!testCase) {
      throw new Error('Test case not found');
    }

    // Convert test steps to Gherkin steps
    const gherkinSteps = testCase.steps.map((step, index) => ({
      keyword: this.determineKeyword(step.action, index) as any,
      text: step.action,
      docString: step.testData,
    }));

    // Create scenario
    return await this.createScenario({
      featureId,
      name: testCase.name,
      description: testCase.summary || undefined,
      type: 'SCENARIO',
      steps: gherkinSteps,
    });
  }

  /**
   * Sync Gherkin files from a directory
   */
  async syncGherkinFiles(testProjectId: string, directoryPath: string) {
    try {
      const files = await this.findGherkinFiles(directoryPath);

      const results = {
        imported: 0,
        updated: 0,
        errors: [] as string[],
      };

      for (const file of files) {
        try {
          // Check if file already imported
          const existing = await prisma.gherkinFeature.findFirst({
            where: {
              testProjectId,
              filePath: file,
            },
          });

          if (existing) {
            // Update existing feature
            results.updated++;
          } else {
            // Import new feature
            await this.importGherkinFile(testProjectId, file);
            results.imported++;
          }
        } catch (error) {
          results.errors.push(`${file}: ${error}`);
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to sync Gherkin files: ${error}`);
    }
  }

  // Private helper methods

  private parseGherkinContent(content: string): any {
    // Simplified Gherkin parser
    // In production, use a proper Gherkin parser library
    const lines = content.split('\n');
    const result: any = {
      feature: { name: '', description: '', tags: [] },
      scenarios: [],
    };

    let currentSection: any = null;
    let currentScenario: any = null;
    let currentTags: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('@')) {
        currentTags = trimmed.split(/\s+/).filter((t) => t.startsWith('@'));
        continue;
      }

      if (trimmed.startsWith('Feature:')) {
        result.feature.name = trimmed.substring(8).trim();
        result.feature.tags = currentTags;
        currentTags = [];
        currentSection = 'feature';
        continue;
      }

      if (trimmed.startsWith('Scenario:') || trimmed.startsWith('Scenario Outline:')) {
        if (currentScenario) {
          result.scenarios.push(currentScenario);
        }

        currentScenario = {
          name: trimmed.replace(/^(Scenario|Scenario Outline):/, '').trim(),
          type: trimmed.startsWith('Scenario Outline:')
            ? 'SCENARIO_OUTLINE'
            : 'SCENARIO',
          tags: currentTags,
          steps: [],
        };
        currentTags = [];
        currentSection = 'scenario';
        continue;
      }

      if (
        trimmed.match(/^(Given|When|Then|And|But)\s/)
      ) {
        const match = trimmed.match(/^(Given|When|Then|And|But)\s+(.+)$/);
        if (match && currentScenario) {
          currentScenario.steps.push({
            keyword: match[1].toUpperCase(),
            text: match[2],
          });
        }
        continue;
      }

      // Handle description lines
      if (currentSection === 'feature' && trimmed && !trimmed.startsWith('#')) {
        result.feature.description =
          (result.feature.description || '') + trimmed + ' ';
      }
    }

    if (currentScenario) {
      result.scenarios.push(currentScenario);
    }

    return result;
  }

  private generateGherkinContent(feature: any): string {
    let content = '';

    // Feature tags
    if (feature.tags && feature.tags.length > 0) {
      content += feature.tags.join(' ') + '\n';
    }

    // Feature header
    content += `Feature: ${feature.name}\n`;

    // Feature description
    if (feature.description) {
      content += `  ${feature.description}\n`;
    }

    content += '\n';

    // Scenarios
    for (const scenario of feature.scenarios) {
      // Scenario tags
      if (scenario.tags && scenario.tags.length > 0) {
        content += '  ' + scenario.tags.join(' ') + '\n';
      }

      // Scenario header
      const scenarioType =
        scenario.type === 'SCENARIO_OUTLINE' ? 'Scenario Outline' : 'Scenario';
      content += `  ${scenarioType}: ${scenario.name}\n`;

      // Scenario description
      if (scenario.description) {
        content += `    ${scenario.description}\n`;
      }

      // Steps
      for (const step of scenario.steps) {
        content += `    ${step.keyword} ${step.text}\n`;
        if (step.docString) {
          content += `      """\n      ${step.docString}\n      """\n`;
        }
      }

      content += '\n';
    }

    return content;
  }

  private async findGherkinFiles(directoryPath: string): Promise<string[]> {
    const files: string[] = [];

    async function traverse(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await traverse(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.feature')) {
          files.push(fullPath);
        }
      }
    }

    await traverse(directoryPath);
    return files;
  }

  private determineKeyword(action: string, index: number): string {
    if (index === 0) {
      return 'GIVEN';
    }

    const lowerAction = action.toLowerCase();
    if (
      lowerAction.includes('verify') ||
      lowerAction.includes('should') ||
      lowerAction.includes('expect')
    ) {
      return 'THEN';
    }

    if (
      lowerAction.includes('click') ||
      lowerAction.includes('enter') ||
      lowerAction.includes('select')
    ) {
      return 'WHEN';
    }

    return 'AND';
  }
}

export default new GherkinService();
