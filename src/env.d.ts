/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMeta {
  globEager<T = any>(pattern: string): Record<string, T>;
}

interface ImportMetaEnv {
  readonly TIDIO_PUBLIC_KEY: string;
  // 可以根据实际需求添加其他环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}