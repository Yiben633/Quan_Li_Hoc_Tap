import type { Request, Response } from 'express';

type AppHandler = (request: Request, response: Response) => unknown;

let app: AppHandler | undefined;

function loadApp() {
  // @vercel/node wraps this entrypoint in CommonJS. Load the dedicated
  // CommonJS artifact rather than the ESM source tree. Keep the module path
  // dynamic: Vercel packages `includeFiles` after the build command, so a
  // static require here is incorrectly resolved before the artifact exists.
  const compiledAppPath = ['..', 'dist-vercel', 'src', 'app.js'].join('/');
  app ??= (require(compiledAppPath) as { default: AppHandler }).default;
  return app;
}

export default async function handler(request: Request, response: Response) {
  const app = await loadApp();
  return app(request, response);
}
