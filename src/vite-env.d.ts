/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_AUTH_BASE_URL?: string;
  readonly VITE_AUTH_CALLBACK_URL?: string;
  readonly VITE_AUTH_LOGOUT_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
