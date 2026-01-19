import { Request, Response, NextFunction } from 'express';
import DashboardService from '../services/dashboard.service';

export class DashboardController {
  /**
   * @route   GET /api/dashboard/:projectId
   * @desc    Get workspace dashboard data
   * @access  Private
   */
  static async getWorkspaceDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;

      const dashboardData = await DashboardService.getWorkspaceDashboard(projectId);

      res.status(200).json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/dashboard/:projectId/test-cases-summary
   * @desc    Get test cases summary
   * @access  Private
   */
  static async getTestCasesSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;

      const summary = await DashboardService.getTestCasesSummary(projectId);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/dashboard/:projectId/execution-summary
   * @desc    Get execution summary
   * @access  Private
   */
  static async getExecutionSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;

      const summary = await DashboardService.getExecutionSummary(projectId);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/dashboard/:projectId/requirement-coverage
   * @desc    Get requirement coverage
   * @access  Private
   */
  static async getRequirementCoverage(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;

      const coverage = await DashboardService.getRequirementCoverage(projectId);

      res.status(200).json({
        success: true,
        data: coverage,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/dashboard/:projectId/recent-test-runs
   * @desc    Get recent test runs
   * @access  Private
   */
  static async getRecentTestRuns(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const limit = parseInt(req.query.limit as string) || 5;

      const runs = await DashboardService.getRecentTestRuns(projectId, limit);

      res.status(200).json({
        success: true,
        data: runs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/dashboard/:projectId/execution-trends
   * @desc    Get execution trends
   * @access  Private
   */
  static async getExecutionTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      const trends = await DashboardService.getExecutionTrends(projectId, days);

      res.status(200).json({
        success: true,
        data: trends,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/dashboard/:projectId/risk-metrics
   * @desc    Get risk metrics
   * @access  Private
   */
  static async getRiskMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;

      const metrics = await DashboardService.getRiskMetrics(projectId);

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default DashboardController;
