import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generate JWT Token
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'default-secret-key';
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']) || '7d'
  };

  return jwt.sign({ id: userId }, secret, options);
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username: rawUsername, email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Check if user exists
    const userExists = await prisma.user.findFirst({
      where: {
        OR: [{ email }, rawUsername ? { username: rawUsername } : undefined].filter(Boolean) as any,
      },
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'User with this email or username already exists',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Derive username if missing
    let username = rawUsername as string | undefined;
    if (!username) {
      const base = (email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_\.\-]/g, '').slice(0, 20);
      username = base || `user${Math.floor(Math.random() * 10000)}`;
      // Ensure uniqueness
      const exists = await prisma.user.findUnique({ where: { username } });
      if (exists) {
        username = `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        role: 'TESTER', // Default role
      },
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin login
// @route   POST /api/auth/admin/login
// @access  Public (requires account with ADMIN role)
export const adminLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const token = generateToken(user.id);
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as any;
    if (!authReq.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const user = await prisma.user.findUnique({
      where: { id: authReq.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as any;
    if (!authReq.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: authReq.user.id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};
