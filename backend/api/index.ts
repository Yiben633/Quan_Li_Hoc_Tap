import type { Request, Response } from 'express';

type AppHandler = (request: Request, response: Response) => unknown;

let app: AppHandler | undefined;

function loadApp() {
  // @vercel/node wraps this entrypoint in CommonJS. Load the dedicated
  // CommonJS artifact rather than the ESM source tree.
  app ??= require('../dist-vercel/src/app.js').default as AppHandler;
  return app;
}

export default async function handler(request: Request, response: Response) {
  const app = await loadApp();
  return app(request, response);
}
