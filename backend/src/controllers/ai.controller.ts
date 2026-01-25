import { Request, Response } from 'express';
import aiService from '../services/ai.service';

export class AIController {
  /**
   * Generate test cases from requirements
   * POST /api/ai/generate-tests
   */
  async generateTests(req: Request, res: Response) {
    try {
      const { requirementId, description, testProjectId } = req.body;

      if (!testProjectId) {
        return res.status(400).json({
          error: 'testProjectId is required',
        });
      }

      const suggestions = await aiService.generateTestSuggestions({
        requirementId,
        description,
        testProjectId,
      });

      res.json({
        success: true,
        data: suggestions,
        message: 'Test suggestions generated successfully',
      });
    } catch (error: any) {
      console.error('Generate tests error:', error);
      res.status(500).json({
        error: 'Failed to generate test suggestions',
        message: error.message,
      });
    }
  }

  /**
   * Suggest improvements for existing test case
   * POST /api/ai/suggest-improvements
   */
  async suggestImprovements(req: Request, res: Response) {
    try {
      const { testCaseId, focusArea = 'all' } = req.body;

      if (!testCaseId) {
        return res.status(400).json({
          error: 'testCaseId is required',
        });
      }

      const suggestion = await aiService.suggestTestImprovements({
        testCaseId,
        focusArea,
      });

      res.json({
        success: true,
        data: suggestion,
        message: 'Improvement suggestions generated successfully',
      });
    } catch (error: any) {
      console.error('Suggest improvements error:', error);
      res.status(500).json({
        error: 'Failed to generate improvement suggestions',
        message: error.message,
      });
    }
  }

  /**
   * Detect duplicate test cases
   * GET /api/ai/detect-duplicates/:projectId
   */
  async detectDuplicates(req: Request, res: Response) {
    try {
      const { projectId } = req.params;

      const duplicates = await aiService.detectDuplicates(projectId);

      res.json({
        success: true,
        data: duplicates,
        count: duplicates.length,
        message: `Found ${duplicates.length} potential duplicates`,
      });
    } catch (error: any) {
      console.error('Detect duplicates error:', error);
      res.status(500).json({
        error: 'Failed to detect duplicates',
        message: error.message,
      });
    }
  }

  /**
   * Detect flaky tests
   * POST /api/ai/detect-flaky
   */
  async detectFlaky(req: Request, res: Response) {
    try {
      const { testCaseId, runs } = req.body;

      if (!testCaseId || !runs) {
        return res.status(400).json({
          error: 'testCaseId and runs are required',
        });
      }

      const detection = await aiService.detectFlakyTests({
        testCaseId,
        runs,
      });

      res.json({
        success: true,
        data: detection,
        message: detection.isFlaky
          ? 'Flaky test detected'
          : 'Test appears stable',
      });
    } catch (error: any) {
      console.error('Detect flaky error:', error);
      res.status(500).json({
        error: 'Failed to detect flaky tests',
        message: error.message,
      });
    }
  }

  /**
   * Generate AI-assisted report
   * POST /api/ai/generate-report
   */
  async generateReport(req: Request, res: Response) {
    try {
      const { testProjectId, reportType, prompt } = req.body;

      if (!testProjectId || !reportType) {
        return res.status(400).json({
          error: 'testProjectId and reportType are required',
        });
      }

      const report = await aiService.generateAIReport(
        testProjectId,
        reportType,
        prompt
      );

      res.json({
        success: true,
        data: report,
        message: 'AI report generated successfully',
      });
    } catch (error: any) {
      console.error('Generate report error:', error);
      res.status(500).json({
        error: 'Failed to generate AI report',
        message: error.message,
      });
    }
  }

  /**
   * Calculate automation coverage gaps
   * GET /api/ai/coverage-gaps/:projectId
   */
  async getCoverageGaps(req: Request, res: Response) {
    try {
      const { projectId } = req.params;

      const coverage = await aiService.calculateCoverageGaps(projectId);

      res.json({
        success: true,
        data: coverage,
        message: 'Coverage gaps calculated successfully',
      });
    } catch (error: any) {
      console.error('Coverage gaps error:', error);
      res.status(500).json({
        error: 'Failed to calculate coverage gaps',
        message: error.message,
      });
    }
  }

  /**
   * Get AI suggestions for a project
   * GET /api/ai/suggestions/:projectId
   */
  async getSuggestions(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { status, type, limit = 10 } = req.query;

      // This would query the AITestSuggestion table
      // For now, returning a placeholder
      res.json({
        success: true,
        data: [],
        message: 'Suggestions retrieved successfully',
      });
    } catch (error: any) {
      console.error('Get suggestions error:', error);
      res.status(500).json({
        error: 'Failed to retrieve suggestions',
        message: error.message,
      });
    }
  }

  /**
   * Accept AI suggestion
   * POST /api/ai/suggestions/:id/accept
   */
  async acceptSuggestion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      // Implementation would update the suggestion status
      res.json({
        success: true,
        message: 'Suggestion accepted successfully',
      });
    } catch (error: any) {
      console.error('Accept suggestion error:', error);
      res.status(500).json({
        error: 'Failed to accept suggestion',
        message: error.message,
      });
    }
  }

  /**
   * Reject AI suggestion
   * POST /api/ai/suggestions/:id/reject
   */
  async rejectSuggestion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      // Implementation would update the suggestion status
      res.json({
        success: true,
        message: 'Suggestion rejected successfully',
      });
    } catch (error: any) {
      console.error('Reject suggestion error:', error);
      res.status(500).json({
        error: 'Failed to reject suggestion',
        message: error.message,
      });
    }
  }
}

export default new AIController();
