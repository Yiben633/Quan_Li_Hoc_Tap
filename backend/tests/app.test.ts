import request from 'supertest';
import { app } from '../src/app.js';

describe('backend foundation', () => {
  it('returns the standard success envelope', async () => {
    const response = await request(app).get('/api');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'StudyFlow API',
      data: { version: '0.1.0' },
    });
  });

  it('returns the standard error envelope for unknown routes', async () => {
    const response = await request(app).get('/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ success: false, message: 'Route not found: GET /does-not-exist' });
  });
});
