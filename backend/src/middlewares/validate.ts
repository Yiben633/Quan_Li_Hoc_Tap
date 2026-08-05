import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

const validate = (source: 'body' | 'query'): ((schema: ZodType) => RequestHandler) =>
  (schema) => (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(result.error);
    req[source] = result.data;
    next();
  };

export const validateBody = validate('body');
export const validateQuery = validate('query');
