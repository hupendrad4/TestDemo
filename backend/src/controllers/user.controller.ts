import { Request, Response, NextFunction } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const isValidRole = (role?: string): role is UserRole => {
  return !!role && Object.values(UserRole).includes(role as UserRole);
};

const publicUserSelect = {
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  createdAt: true,
  lastLoginAt: true,
};

const deriveUsername = async (email: string, preferred?: string | null) => {
  if (preferred) {
    const trimmed = preferred.trim();
    if (trimmed) {
      const exists = await prisma.user.findUnique({ where: { username: trimmed } });
      if (!exists) {
        return trimmed;
      }
    }
  }

  const baseCandidate = (email.split('@')[0] || 'user')
    .replace(/[^a-zA-Z0-9_.-]/g, '')
    .slice(0, 30);
  let candidate = baseCandidate || `user${Math.floor(Math.random() * 10000)}`;
  let suffix = 1;

  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    candidate = `${baseCandidate || 'user'}-${Math.floor(1000 + Math.random() * 9000)}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

// List users
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: publicUserSelect,
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// Get single user
export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: publicUserSelect,
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// Create user
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body as {
      username?: string;
      email?: string;
      password?: string;
      firstName?: string | null;
      lastName?: string | null;
      role?: UserRole;
    };

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    if (role && !isValidRole(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role supplied' });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          username ? { username } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const finalUsername = await deriveUsername(email, username || null);
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        username: finalUsername,
        email,
        passwordHash,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        role: role ?? UserRole.TESTER,
      },
      select: publicUserSelect,
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// Update user core fields
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, role } = req.body as {
      firstName?: string | null;
      lastName?: string | null;
      role?: UserRole;
    };

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (role !== undefined && !isValidRole(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role supplied' });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        firstName: firstName ?? existing.firstName,
        lastName: lastName ?? existing.lastName,
        role: role ?? existing.role,
      },
      select: publicUserSelect,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Update only the role
export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body as { role?: UserRole };
    if (!isValidRole(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role supplied' });
    }

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: publicUserSelect,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Activate / deactivate account
export const setActiveStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isActive } = req.body as { isActive?: boolean };
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, error: 'isActive must be provided' });
    }

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive },
      select: publicUserSelect,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// Promote the current user when no admin exists
export const bootstrapAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminCount = await prisma.user.count({ where: { role: UserRole.ADMIN } });
    if (adminCount > 0) {
      return res.status(403).json({ success: false, error: 'An admin already exists' });
    }

    const authReq = req as Request & { user?: { id: string } };
    if (!authReq.user?.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const updated = await prisma.user.update({
      where: { id: authReq.user.id },
      data: { role: UserRole.ADMIN },
      select: publicUserSelect,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Replace project assignments for a user
export const updateUserProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectIds, assignments } = req.body as {
      projectIds?: string[];
      assignments?: { projectId: string; role?: string }[];
    };

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await prisma.projectMember.deleteMany({ where: { userId: req.params.id } });

    if (Array.isArray(assignments) && assignments.length > 0) {
      const data = assignments
        .filter((assignment) => assignment?.projectId)
        .map((assignment) => ({
          testProjectId: assignment.projectId,
          userId: req.params.id,
          role: assignment.role || 'TESTER',
        }));

      if (data.length > 0) {
        await prisma.projectMember.createMany({ data, skipDuplicates: true });
      }
    } else if (Array.isArray(projectIds) && projectIds.length > 0) {
      await prisma.projectMember.createMany({
        data: projectIds.map((projectId) => ({
          testProjectId: projectId,
          userId: req.params.id,
          role: 'TESTER',
        })),
        skipDuplicates: true,
      });
    }

    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.params.id },
      select: { testProjectId: true, role: true },
    });

    res.status(200).json({ success: true, data: memberships });
  } catch (error) {
    next(error);
  }
};
