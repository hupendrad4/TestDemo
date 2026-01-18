import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from './auth.middleware';

const prisma = new PrismaClient();

export type ProjectRole = 'PROJECT_ADMIN' | 'QA_MANAGER' | 'TESTER' | 'REVIEWER' | 'VIEWER';

interface Options {
  resolveProjectId?: (req: Request) => string | undefined;
}

// Checks if user has access to a specific project by membership role or project public visibility.
export const requireProjectRole = (allowed: ProjectRole[] | 'ANY', options?: Options) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const resolver = options?.resolveProjectId;
      const paramId = (req.params as any).projectId || (req.params as any).id;
      const projectId = (resolver ? resolver(req) : paramId) as string | undefined;
      if (!projectId) return res.status(400).json({ success: false, error: 'Project id is required' });

      const project = await prisma.testProject.findUnique({ where: { id: projectId } });
      if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

      // Admins always allowed
      if (req.user?.role === 'ADMIN') return next();

      // Public projects are viewable for ANY
      if (project.isPublic && (allowed === 'ANY' || Array.isArray(allowed))) return next();

      if (!req.user?.id) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const membership = await prisma.projectMember.findUnique({
        where: { testProjectId_userId: { testProjectId: projectId, userId: req.user.id } },
        select: { role: true },
      });

      if (!membership) return res.status(403).json({ success: false, error: 'No access to project' });

      if (allowed === 'ANY') return next();

      if (Array.isArray(allowed) && allowed.includes(membership.role as ProjectRole)) {
        return next();
      }

      return res.status(403).json({ success: false, error: 'Insufficient project role' });
    } catch (err) {
      next(err);
    }
  };
};
