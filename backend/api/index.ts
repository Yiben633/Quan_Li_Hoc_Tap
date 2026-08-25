import type { Request, Response } from 'express';

type AppHandler = (request: Request, response: Response) => unknown;

let appPromise: Promise<AppHandler> | undefined;

function loadApp() {
  // Vercel loads the function wrapper as CommonJS in some monorepo builds.
  // A native dynamic import preserves the ESM boundary used by src/.
  appPromise ??= import('../src/app.js').then(({ default: app }) => app as AppHandler);
  return appPromise;
}

export default async function handler(request: Request, response: Response) {
  const app = await loadApp();
  return app(request, response);
}
