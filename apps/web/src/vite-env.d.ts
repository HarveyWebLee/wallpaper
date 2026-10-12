/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 远程退休规则包 JSON 地址（可选，默认 GitHub raw main） */
  readonly VITE_RETIREMENT_RULE_PACK_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
