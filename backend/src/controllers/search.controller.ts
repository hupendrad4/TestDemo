import { Request, Response, NextFunction } from 'express';
import SearchService from '../services/search.service';

export class SearchController {
  /**
   * @route   GET /api/search/global
   * @desc    Global search across multiple entities
   * @access  Private
   */
  static async globalSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const { query, projectId, limit } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
      }

      const results = await SearchService.globalSearch(
        query,
        projectId as string | undefined,
        limit ? parseInt(limit as string) : 20
      );

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/search/test-cases
   * @desc    Search test cases with advanced filters
   * @access  Private
   */
  static async searchTestCases(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, query, status, priority, executionType, suiteId, limit, offset } = req.query;

      const results = await SearchService.searchTestCases({
        projectId: projectId as string | undefined,
        query: query as string | undefined,
        status: status ? (status as string).split(',') : undefined,
        priority: priority ? (priority as string).split(',') : undefined,
        executionType: executionType ? (executionType as string).split(',') : undefined,
        suiteId: suiteId as string | undefined,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      });

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/search/quick
   * @desc    Quick search for autocomplete
   * @access  Private
   */
  static async quickSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const { query, entityType, projectId, limit } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
      }

      if (!entityType || typeof entityType !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Entity type is required',
        });
      }

      const results = await SearchService.quickSearch(
        query,
        entityType,
        projectId as string | undefined,
        limit ? parseInt(limit as string) : 10
      );

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default SearchController;
