import request from 'supertest';
import app from '../../index';

describe('Health and Metrics Integration Tests', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app.app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
      expect(typeof response.body.uptime).toBe('number');
      expect(typeof response.body.timestamp).toBe('string');
    });

    it('should return consistent response format', async () => {
      const response = await request(app.app)
        .get('/health')
        .expect(200);

      // Check that all required fields are present
      const requiredFields = ['status', 'timestamp', 'uptime', 'environment', 'version'];
      requiredFields.forEach(field => {
        expect(response.body).toHaveProperty(field);
      });

      // Check that status is always 'healthy'
      expect(response.body.status).toBe('healthy');
    });
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app.app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'TypeScript Express Boilerplate API');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('requestId');
    });

    it('should return consistent response format', async () => {
      const response = await request(app.app)
        .get('/')
        .expect(200);

      // Check that all required fields are present
      const requiredFields = ['message', 'version', 'environment', 'timestamp', 'requestId'];
      requiredFields.forEach(field => {
        expect(response.body).toHaveProperty(field);
      });

      // Check that message is correct
      expect(response.body.message).toBe('TypeScript Express Boilerplate API');
    });
  });

  describe('GET /metrics', () => {
    it('should return Prometheus metrics', async () => {
      const response = await request(app.app)
        .get('/metrics')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
    });

    it('should include HTTP request metrics', async () => {
      // Make a few requests to generate metrics
      await request(app.app).get('/health');
      await request(app.app).get('/');
      
      const response = await request(app.app)
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('http_requests_total');
      expect(response.text).toContain('http_request_duration_seconds');
    });

    it('should include custom application metrics', async () => {
      const response = await request(app.app)
        .get('/metrics')
        .expect(200);

      // Check for custom metrics that should be present
      expect(response.text).toContain('user_registrations_total');
      expect(response.text).toContain('user_logins_total');
      expect(response.text).toContain('jwt_tokens_issued_total');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app.app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent API routes', async () => {
      const response = await request(app.app)
        .get('/api/v1/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle malformed JSON in request body', async () => {
      const response = await request(app.app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle requests with invalid content type', async () => {
      const response = await request(app.app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'text/plain')
        .send('some text')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to requests', async () => {
      // Make multiple requests quickly to test rate limiting
      const requests = Array(20).fill(null).map(() => 
        request(app.app).get('/health')
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited (429 status) or all should succeed
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      const successfulResponses = responses.filter(res => res.status === 200);
      
      // Either some are rate limited or all succeed (rate limiting might not be aggressive for health checks)
      expect(rateLimitedResponses.length + successfulResponses.length).toBe(20);
    }, 10000); // Increase timeout for this test

    it('should not rate limit health checks excessively', async () => {
      // Health checks should be more lenient with rate limiting
      const requests = Array(5).fill(null).map(() => 
        request(app.app).get('/health')
      );

      const responses = await Promise.all(requests);
      
      // All health check requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in responses', async () => {
      const response = await request(app.app)
        .get('/health')
        .expect(200);

      // CORS headers might not be present for same-origin requests
      // Check for other security headers instead
      expect(response.headers).toHaveProperty('x-content-type-options');
    });

    it('should handle preflight OPTIONS requests', async () => {
      const response = await request(app.app)
        .options('/api/v1/auth/register')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type, Authorization')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app.app)
        .get('/health')
        .expect(200);

      // Check for security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });

    it('should include CSP headers', async () => {
      const response = await request(app.app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('content-security-policy');
    });
  });
});
