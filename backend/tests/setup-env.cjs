process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://studyflow:change_me_strong_password@localhost:55432/studyflow_dev?schema=public';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://:change_me_redis_password@localhost:6379';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-long-enough';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-long-enough';
process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
process.env.CRON_SECRET = process.env.CRON_SECRET || 'test-cron-secret-32-characters';
process.env.AI_PROVIDER = 'mock';
