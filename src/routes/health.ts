import { Router, Request, Response } from 'express';
import { getPrismaClient } from '@/utils/database';
import { logger } from '@/utils/logger';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const prisma = getPrismaClient();

    // Check database connection
    await prisma.$runCommandRaw({ ping: 1 });

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env['NODE_ENV'] || 'development',
      version: '1.0.0',
      database: 'connected',
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env['NODE_ENV'] || 'development',
      version: '1.0.0',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
