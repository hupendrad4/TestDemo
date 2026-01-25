import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestGenerationRequest {
  requirementId?: string;
  description: string;
  testProjectId: string;
}

interface TestImprovementRequest {
  testCaseId: string;
  focusArea: 'steps' | 'coverage' | 'clarity' | 'all';
}

interface FlakyTestAnalysis {
  testCaseId: string;
  runs: Array<{
    status: string;
    executedAt: Date;
    duration?: number;
  }>;
}

export class AIService {
  /**
   * Generate test suggestions from requirements
   */
  async generateTestSuggestions(data: TestGenerationRequest) {
    // In production, this would integrate with OpenAI/Anthropic API
    // For now, we'll create structured suggestions based on requirement analysis
    
    const requirement = data.requirementId 
      ? await prisma.requirement.findUnique({
          where: { id: data.requirementId },
          include: { testCases: true }
        })
      : null;

    // Analyze requirement and generate test cases
    const suggestions = this.analyzeAndGenerateTests(
      requirement?.description || data.description
    );

    // Store suggestions in database
    const createdSuggestions = await Promise.all(
      suggestions.map((suggestion) =>
        prisma.aITestSuggestion.create({
          data: {
            requirementId: data.requirementId,
            testProjectId: data.testProjectId,
            suggestionType: 'TEST_GENERATION',
            title: suggestion.title,
            description: suggestion.description,
            generatedSteps: suggestion.steps,
            confidence: suggestion.confidence,
            status: 'PENDING',
          },
        })
      )
    );

    return createdSuggestions;
  }

  /**
   * Suggest improvements for existing test cases
   */
  async suggestTestImprovements(data: TestImprovementRequest) {
    const testCase = await prisma.testCase.findUnique({
      where: { id: data.testCaseId },
      include: {
        steps: true,
        executions: {
          take: 10,
          orderBy: { executedAt: 'desc' },
        },
      },
    });

    if (!testCase) {
      throw new Error('Test case not found');
    }

    const improvements = this.analyzeTestCase(testCase, data.focusArea);

    const suggestion = await prisma.aITestSuggestion.create({
      data: {
        testCaseId: data.testCaseId,
        testProjectId: testCase.testSuiteId, // This should be project ID
        suggestionType: 'TEST_IMPROVEMENT',
        title: `Improvements for: ${testCase.name}`,
        description: improvements.description,
        generatedSteps: improvements.steps,
        confidence: improvements.confidence,
        status: 'PENDING',
      },
    });

    return suggestion;
  }

  /**
   * Detect duplicate test cases
   */
  async detectDuplicates(testProjectId: string) {
    const testCases = await prisma.testCase.findMany({
      where: {
        testSuite: {
          testProjectId,
        },
        isActive: true,
      },
      include: {
        steps: true,
      },
    });

    const duplicates = this.findSimilarTests(testCases);

    return duplicates;
  }

  /**
   * Analyze and detect flaky tests
   */
  async detectFlakyTests(data: FlakyTestAnalysis) {
    const { testCaseId, runs } = data;

    if (runs.length < 5) {
      return { isFlaky: false, message: 'Not enough runs to determine flakiness' };
    }

    // Calculate flakiness metrics
    const totalRuns = runs.length;
    const failedRuns = runs.filter((r) => r.status === 'FAILED').length;
    const passedAfterFail = this.countPassedAfterFail(runs);
    const consecutiveFails = this.getMaxConsecutiveFails(runs);

    // Flakiness score calculation
    const flakinessScore = this.calculateFlakinessScore({
      totalRuns,
      failedRuns,
      passedAfterFail,
      consecutiveFails,
    });

    const isFlaky = flakinessScore > 0.3; // 30% threshold

    // Update or create flaky test detection record
    const detection = await prisma.flakyTestDetection.upsert({
      where: { testCaseId },
      create: {
        testCaseId,
        flakinessScore,
        consecutiveFails,
        totalRuns,
        failedRuns,
        passedAfterFail,
        isFlaky,
        autoTagged: isFlaky,
        notes: isFlaky
          ? `Detected as flaky with score ${flakinessScore.toFixed(2)}`
          : 'Test appears stable',
      },
      update: {
        flakinessScore,
        consecutiveFails,
        totalRuns,
        failedRuns,
        passedAfterFail,
        isFlaky,
        autoTagged: isFlaky,
        updatedAt: new Date(),
      },
    });

    // If flaky, create AI suggestion for fixing
    if (isFlaky) {
      await prisma.aITestSuggestion.create({
        data: {
          testCaseId,
          testProjectId: '', // Should get from testCase
          suggestionType: 'FLAKY_TEST_FIX',
          title: 'Flaky Test Detected - Suggestions to Fix',
          description: this.generateFlakySuggestions(detection),
          confidence: flakinessScore,
          status: 'PENDING',
        },
      });
    }

    return detection;
  }

  /**
   * Generate AI-assisted report
   */
  async generateAIReport(
    testProjectId: string,
    reportType: string,
    prompt?: string
  ) {
    // Fetch relevant data for the report
    const metrics = await this.getProjectMetrics(testProjectId);
    const recentExecutions = await this.getRecentExecutions(testProjectId, 50);
    const defects = await this.getOpenDefects(testProjectId);
    const flakyTests = await this.getFlakyTests(testProjectId);

    // Generate AI summary and insights
    const summary = this.generateReportSummary({
      metrics,
      recentExecutions,
      defects,
      flakyTests,
      prompt,
    });

    const insights = this.generateInsights({
      metrics,
      recentExecutions,
      defects,
      flakyTests,
    });

    const report = await prisma.aIReport.create({
      data: {
        testProjectId,
        reportType: reportType as any,
        prompt,
        summary,
        insights,
        generatedById: 'system', // Should be actual user ID
      },
    });

    return report;
  }

  /**
   * Calculate automation coverage gaps
   */
  async calculateCoverageGaps(testProjectId: string) {
    const testCases = await prisma.testCase.findMany({
      where: {
        testSuite: {
          testProjectId,
        },
        isActive: true,
      },
      include: {
        requirements: {
          include: {
            requirement: true,
          },
        },
      },
    });

    const totalTests = testCases.length;
    const automatedTests = testCases.filter(
      (tc) => tc.executionType === 'AUTOMATED'
    ).length;
    const manualTests = totalTests - automatedTests;
    const coveragePercentage = totalTests > 0 ? (automatedTests / totalTests) * 100 : 0;

    // Update coverage tracking
    await prisma.automationCoverage.create({
      data: {
        testProjectId,
        totalTests,
        automatedTests,
        manualTests,
        coveragePercentage,
        lastCalculated: new Date(),
      },
    });

    // Identify manual tests that could be automated
    const automationCandidates = testCases
      .filter((tc) => tc.executionType === 'MANUAL')
      .filter((tc) => {
        // Heuristics: frequent execution, clear steps, no complex UI
        const hasRequirements = tc.requirements.length > 0;
        const hasSteps = true; // Would check actual steps
        return hasRequirements && hasSteps;
      })
      .slice(0, 10); // Top 10 candidates

    // Create AI suggestions for automation
    await Promise.all(
      automationCandidates.map((tc) =>
        prisma.aITestSuggestion.create({
          data: {
            testCaseId: tc.id,
            testProjectId,
            suggestionType: 'MISSING_COVERAGE',
            title: `Automation candidate: ${tc.name}`,
            description: 'This test case is a good candidate for automation',
            confidence: 0.7,
            status: 'PENDING',
          },
        })
      )
    );

    return {
      totalTests,
      automatedTests,
      manualTests,
      coveragePercentage,
      automationCandidates: automationCandidates.length,
    };
  }

  // Private helper methods

  private analyzeAndGenerateTests(description: string) {
    // Simplified test generation logic
    // In production, this would use AI APIs
    return [
      {
        title: 'Positive Test Case',
        description: `Verify ${description} works as expected`,
        steps: [
          { action: 'Navigate to feature', expected: 'Feature page loads' },
          { action: 'Perform action', expected: 'Action completes successfully' },
          { action: 'Verify result', expected: 'Result matches expected' },
        ],
        confidence: 0.85,
      },
      {
        title: 'Negative Test Case',
        description: `Verify ${description} handles errors correctly`,
        steps: [
          { action: 'Navigate to feature', expected: 'Feature page loads' },
          { action: 'Perform invalid action', expected: 'Error message displayed' },
          { action: 'Verify error handling', expected: 'System remains stable' },
        ],
        confidence: 0.8,
      },
    ];
  }

  private analyzeTestCase(testCase: any, focusArea: string) {
    return {
      description: `Suggested improvements for ${testCase.name}`,
      steps: testCase.steps || [],
      confidence: 0.75,
    };
  }

  private findSimilarTests(testCases: any[]) {
    const duplicates: any[] = [];
    
    for (let i = 0; i < testCases.length; i++) {
      for (let j = i + 1; j < testCases.length; j++) {
        const similarity = this.calculateSimilarity(testCases[i], testCases[j]);
        if (similarity > 0.8) {
          duplicates.push({
            test1: testCases[i],
            test2: testCases[j],
            similarity,
          });
        }
      }
    }

    return duplicates;
  }

  private calculateSimilarity(test1: any, test2: any): number {
    // Simple similarity calculation based on name
    const name1 = test1.name.toLowerCase();
    const name2 = test2.name.toLowerCase();
    
    let matchCount = 0;
    const words1 = name1.split(' ');
    const words2 = name2.split(' ');
    
    words1.forEach(word => {
      if (words2.includes(word)) {
        matchCount++;
      }
    });
    
    return matchCount / Math.max(words1.length, words2.length);
  }

  private countPassedAfterFail(runs: any[]): number {
    let count = 0;
    for (let i = 1; i < runs.length; i++) {
      if (runs[i - 1].status === 'FAILED' && runs[i].status === 'PASSED') {
        count++;
      }
    }
    return count;
  }

  private getMaxConsecutiveFails(runs: any[]): number {
    let maxConsecutive = 0;
    let currentConsecutive = 0;

    runs.forEach((run) => {
      if (run.status === 'FAILED') {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    });

    return maxConsecutive;
  }

  private calculateFlakinessScore(metrics: any): number {
    const { totalRuns, failedRuns, passedAfterFail, consecutiveFails } = metrics;

    const failureRate = failedRuns / totalRuns;
    const inconsistencyRate = passedAfterFail / Math.max(failedRuns, 1);
    const maxConsecutiveWeight = Math.min(consecutiveFails / 5, 1);

    return (failureRate * 0.4 + inconsistencyRate * 0.4 + maxConsecutiveWeight * 0.2);
  }

  private generateFlakySuggestions(detection: any): string {
    let suggestions = 'Flaky test detected. Suggested fixes:\n\n';
    suggestions += '1. Add proper wait conditions instead of hard sleeps\n';
    suggestions += '2. Check for race conditions in test setup/teardown\n';
    suggestions += '3. Verify test data is properly isolated\n';
    suggestions += '4. Review environmental dependencies\n';
    suggestions += `5. Current flakiness score: ${detection.flakinessScore.toFixed(2)}\n`;
    return suggestions;
  }

  private async getProjectMetrics(testProjectId: string) {
    return await prisma.testMetrics.findFirst({
      where: { testProjectId },
      orderBy: { date: 'desc' },
    });
  }

  private async getRecentExecutions(testProjectId: string, limit: number) {
    return await prisma.testExecution.findMany({
      where: {
        testCase: {
          testSuite: {
            testProjectId,
          },
        },
      },
      take: limit,
      orderBy: { executedAt: 'desc' },
      include: {
        testCase: true,
      },
    });
  }

  private async getOpenDefects(testProjectId: string) {
    // This would need proper relation setup
    return [];
  }

  private async getFlakyTests(testProjectId: string) {
    return await prisma.flakyTestDetection.findMany({
      where: {
        testCase: {
          testSuite: {
            testProjectId,
          },
        },
        isFlaky: true,
      },
      include: {
        testCase: true,
      },
    });
  }

  private generateReportSummary(data: any): string {
    const { metrics, recentExecutions, defects, flakyTests, prompt } = data;

    let summary = 'Test Execution Summary:\n\n';

    if (metrics) {
      summary += `Total Tests: ${metrics.totalTests}\n`;
      summary += `Pass Rate: ${metrics.passRate.toFixed(2)}%\n`;
      summary += `Failed Tests: ${metrics.failedTests}\n`;
      summary += `Flaky Tests: ${metrics.flakyTests}\n`;
      summary += `Open Defects: ${metrics.openDefects}\n`;
      summary += `Automation Rate: ${metrics.automationRate.toFixed(2)}%\n\n`;
    }

    if (prompt) {
      summary += `\nCustom Analysis (based on prompt):\n${prompt}\n`;
    }

    return summary;
  }

  private generateInsights(data: any): any {
    const { metrics, flakyTests } = data;

    return {
      trends: {
        passRate: metrics?.passRate || 0,
        trend: 'stable', // Would calculate from historical data
      },
      recommendations: [
        'Address flaky tests to improve test reliability',
        'Increase automation coverage for repetitive manual tests',
        'Review and fix failing tests promptly',
      ],
      flakyTests: flakyTests.map((ft: any) => ({
        id: ft.testCaseId,
        name: ft.testCase.name,
        score: ft.flakinessScore,
      })),
      coverage: {
        automation: metrics?.automationRate || 0,
        requirements: metrics?.requirementCoverage || 0,
      },
    };
  }
}

export default new AIService();
