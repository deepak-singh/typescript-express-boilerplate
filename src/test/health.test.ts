import request from 'supertest';
import app from '../index';

describe('Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app.app).get('/health').expect(200);

    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('version');
  });

  it('should return API info on root route', async () => {
    const response = await request(app.app).get('/').expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('TypeScript Express Boilerplate API');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('timestamp');
  });
});
