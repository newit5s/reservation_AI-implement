/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV?: string;
  }
}

declare interface ImportMetaEnv {
  readonly MODE: string;
  readonly VITE_API_URL?: string;
  readonly VITE_DEFAULT_BRANCH_ID?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
