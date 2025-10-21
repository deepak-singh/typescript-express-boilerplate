import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config } from '@/config';
import { globalErrorHandler } from '@/errors/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import { rateLimiter } from '@/middleware/rateLimiter';
import { logger, morganStream, addRequestId } from '@/utils/logger';
import { connectDatabase, disconnectDatabase } from '@/utils/database';
import { metricsMiddleware } from '@/utils/metrics';

// Import routes
import healthRoutes from '@/routes/health';
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/users';
import docsRoutes from '@/routes/docs';
import metricsRoutes from '@/routes/metrics';

class App {
  public app: express.Application;
  private server: any;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Request ID middleware (must be first)
    this.app.use(addRequestId);
    
    // Metrics middleware
    this.app.use(metricsMiddleware);
    
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));
    
    // CORS configuration
    this.app.use(cors(config.cors));
    
    // Compression middleware
    this.app.use(compression());
    
    // Rate limiting
    this.app.use(rateLimiter);
    
    // Enhanced logging middleware with Winston
    this.app.use(morgan('combined', {
      stream: morganStream,
      skip: (req) => req.url === '/metrics' // Skip metrics endpoint from access logs
    }));
    
    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  private initializeRoutes(): void {
    // Health check route
    this.app.use('/health', healthRoutes);
    
    // Metrics route (for Prometheus)
    this.app.use('/metrics', metricsRoutes);
    
    // API documentation
    this.app.use('/api/v1', docsRoutes);
    
    // API routes
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/users', userRoutes);
    
    // Root route
    this.app.get('/', (req, res) => {
      res.json({
        message: 'TypeScript Express Boilerplate API',
        version: '1.0.0',
        environment: config.nodeEnv,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(globalErrorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await connectDatabase();
      
      // Start server
      const server = this.app.listen(config.port, () => {
        logger.info(`🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
        logger.info(`📊 Health check available at http://localhost:${config.port}/health`);
        logger.info(`🔗 API documentation available at http://localhost:${config.port}/api/v1`);
        logger.info(`📈 Metrics available at http://localhost:${config.port}/metrics`);
      });

      // Store server reference for graceful shutdown
      this.server = server;
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(async () => {
          logger.info('HTTP server closed');
          try {
            await disconnectDatabase();
            logger.info('Database disconnected');
          } catch (error) {
            logger.error('Error disconnecting from database:', error);
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Create and start the application
const app = new App();
app.start();

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  try {
    await app.stop();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
