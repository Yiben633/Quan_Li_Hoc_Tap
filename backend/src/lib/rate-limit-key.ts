import type { Request } from 'express';
import { ipKeyGenerator } from 'express-rate-limit';

// Express resolves req.ip through the trusted Vercel proxy chain. The helper
// also normalizes IPv6 addresses so one client cannot bypass the limiter.
export function rateLimitKey(request: Request) {
  return ipKeyGenerator(request.ip || 'unknown');
}
