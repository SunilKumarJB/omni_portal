/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Sent as X-Demo-Key on the generate request when the backend has DEMO_API_KEY set. */
  readonly VITE_DEMO_API_KEY?: string;
}
