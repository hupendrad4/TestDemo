import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/artifacts');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Accept images and videos
  const allowedTypes = /jpeg|jpg|png|gif|mp4|webm|mov|avi|pdf|zip/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image, video, PDF, and ZIP files are allowed!'));
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: fileFilter,
});

// @desc    Upload artifact
// @route   POST /api/artifacts/upload
// @access  Private
export const uploadArtifact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const {
      testExecutionId,
      testCaseId,
      title,
      description,
      type,
    } = req.body;

    // Determine artifact type from file
    const ext = path.extname(req.file.originalname).toLowerCase();
    let artifactType = type || 'OTHER';
    
    if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
      artifactType = 'SCREENSHOT';
    } else if (['.mp4', '.webm', '.mov', '.avi'].includes(ext)) {
      artifactType = 'VIDEO';
    } else if (ext === '.pdf') {
      artifactType = 'DOCUMENT';
    } else if (ext === '.zip') {
      artifactType = 'ARCHIVE';
    }

    const artifact = await prisma.attachment.create({
      data: {
        fileName: req.file.originalname,
        filePath: `/uploads/artifacts/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        title: title || req.file.originalname,
        description: description,
        type: artifactType,
        uploadedById: req.user.id,
        ...(testExecutionId && { testExecutionId }),
        ...(testCaseId && { testCaseId }),
      },
      include: {
        uploadedBy: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: artifact,
    });
  } catch (error) {
    // Clean up uploaded file if database operation fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Get artifacts
// @route   GET /api/artifacts
// @access  Private
export const getArtifacts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { testExecutionId, testCaseId, type } = req.query;

    const where: any = {};
    if (testExecutionId) where.testExecutionId = testExecutionId as string;
    if (testCaseId) where.testCaseId = testCaseId as string;
    if (type) where.type = type;

    const artifacts = await prisma.attachment.findMany({
      where,
      include: {
        uploadedBy: {
          select: { id: true, username: true, email: true },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: artifacts.length,
      data: artifacts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single artifact
// @route   GET /api/artifacts/:id
// @access  Private
export const getArtifact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const artifact = await prisma.attachment.findUnique({
      where: { id: req.params.id },
      include: {
        uploadedBy: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    if (!artifact) {
      return res.status(404).json({
        success: false,
        error: 'Artifact not found',
      });
    }

    res.status(200).json({
      success: true,
      data: artifact,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download artifact
// @route   GET /api/artifacts/:id/download
// @access  Private
export const downloadArtifact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const artifact = await prisma.attachment.findUnique({
      where: { id: req.params.id },
    });

    if (!artifact) {
      return res.status(404).json({
        success: false,
        error: 'Artifact not found',
      });
    }

    const filePath = path.join(__dirname, '../..', artifact.filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on server',
      });
    }

    res.download(filePath, artifact.fileName);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete artifact
// @route   DELETE /api/artifacts/:id
// @access  Private
export const deleteArtifact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const artifact = await prisma.attachment.findUnique({
      where: { id: req.params.id },
    });

    if (!artifact) {
      return res.status(404).json({
        success: false,
        error: 'Artifact not found',
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../..', artifact.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await prisma.attachment.delete({
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

// @desc    Bulk upload artifacts
// @route   POST /api/artifacts/bulk-upload
// @access  Private
export const bulkUploadArtifacts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
      });
    }

    const { testExecutionId, testCaseId } = req.body;

    const artifacts = await Promise.all(
      files.map(async (file) => {
        const ext = path.extname(file.originalname).toLowerCase();
        let artifactType = 'OTHER';
        
        if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
          artifactType = 'SCREENSHOT';
        } else if (['.mp4', '.webm', '.mov', '.avi'].includes(ext)) {
          artifactType = 'VIDEO';
        }

        return prisma.attachment.create({
          data: {
            fileName: file.originalname,
            filePath: `/uploads/artifacts/${file.filename}`,
            fileSize: file.size,
            mimeType: file.mimetype,
            title: file.originalname,
            type: artifactType,
            uploadedById: req.user.id,
            ...(testExecutionId && { testExecutionId }),
            ...(testCaseId && { testCaseId }),
          },
        });
      })
    );

    res.status(201).json({
      success: true,
      count: artifacts.length,
      data: artifacts,
    });
  } catch (error) {
    // Clean up uploaded files if database operation fails
    const files = req.files as Express.Multer.File[];
    if (files) {
      files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    next(error);
  }
};
