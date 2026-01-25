import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';

// Catch unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log('Loading server.ts...');

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import projectRoutes from './routes/project.routes';
import testSuiteRoutes from './routes/testSuite.routes';
import testCaseRoutes from './routes/testCase.routes';
import environmentRoutes from './routes/environment.routes';
import testPlanRoutes from './routes/testPlan.routes';
import executionRoutes from './routes/execution.routes';
import requirementRoutes from './routes/requirement.routes';
import reportRoutes from './routes/report.routes';
import adminRoutes from './routes/admin.routes';
import dashboardRoutes from './routes/dashboard.routes';
import notificationRoutes from './routes/notification.routes';
import searchRoutes from './routes/search.routes';
import defectRoutes from './routes/defect.routes';
// New AI-powered and enhanced features
import aiRoutes from './routes/ai.routes';
import artifactRoutes from './routes/artifact.routes';
import publicReportRoutes from './routes/publicReport.routes';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { rateLimiter } from './middleware/rateLimiter.middleware';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3005;
const API_PREFIX = process.env.API_PREFIX || '/api';

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TestDemo API',
      version: '1.0.0',
      description: 'Comprehensive Test Management System API',
      contact: {
        name: 'TestDemo Team',
        email: 'support@testdemo.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}${API_PREFIX}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Middleware
app.use(helmet());
// CORS configuration: allow multiple dev origins
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3002,http://localhost:3004')
  .split(',')
  .map((o) => o.trim());

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow curl and same-origin
    const isAllowed = allowedOrigins.includes(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin) || /^http:\/\/localhost:\d+$/.test(origin);
    callback(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Rate limiting
app.use(rateLimiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Documentation
app.use(`${API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/projects`, projectRoutes);
app.use(`${API_PREFIX}/test-suites`, testSuiteRoutes);
app.use(`${API_PREFIX}/test-cases`, testCaseRoutes);
app.use(`${API_PREFIX}/test-plans`, testPlanRoutes);
app.use(`${API_PREFIX}/executions`, executionRoutes);
app.use(`${API_PREFIX}/requirements`, requirementRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/search`, searchRoutes);
app.use(`${API_PREFIX}/defects`, defectRoutes);
// New AI-powered features
app.use(`${API_PREFIX}/ai`, aiRoutes);
// Environment management
app.use(`${API_PREFIX}`, environmentRoutes);
// Artifact management
app.use(`${API_PREFIX}/artifacts`, artifactRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Stub routes for optional features to prevent 404s
app.get(`${API_PREFIX}/saved-views`, (_req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});
app.post(`${API_PREFIX}/saved-views`, (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Saved views not yet implemented' });
});
app.get(`${API_PREFIX}/watchlist`, (_req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});
app.post(`${API_PREFIX}/watchlist`, (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Watchlist not yet implemented' });
});
app.get(`${API_PREFIX}/builds`, (_req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 TestDemo API Server running on port ${PORT}`);
  logger.info(`📚 API Documentation available at http://localhost:${PORT}${API_PREFIX}/docs`);
  logger.info(`🏥 Health check available at http://localhost:${PORT}/health`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
