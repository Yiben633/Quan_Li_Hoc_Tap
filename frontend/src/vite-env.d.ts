/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_VERCEL_ENV?: string
  readonly VITE_AI_ENABLED?: string
  readonly VITE_AI_PROVIDER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
