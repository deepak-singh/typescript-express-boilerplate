import { Router, Request, Response } from 'express';
import { getMetrics } from '@/utils/metrics';

const router = Router();

/**
 * @route   GET /metrics
 * @desc    Prometheus metrics endpoint
 * @access  Public (in production, you might want to protect this)
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve metrics',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
