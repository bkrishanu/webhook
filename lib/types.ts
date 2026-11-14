export interface CapturedRequest {
  id: string;
  hookId: string;
  method: string;
  path: string;
  url: string;
  query: Record<string, string | string[]>;
  headers: Record<string, string>;
  body: string;
  bodyEncoding: "text" | "base64";
  bodyTruncated: boolean;
  size: number;
  contentType: string;
  ip: string;
  userAgent: string;
  receivedAt: number;
}

export interface ResponseConfig {
  status: number;
  contentType: string;
  body: string;
  headers: { key: string; value: string }[];
}

export const DEFAULT_RESPONSE: ResponseConfig = {
  status: 200,
  contentType: "application/json",
  body: '{\n  "success": true,\n  "message": "Received by HookNest"\n}',
  headers: [],
};

export const MAX_REQUESTS = 500;
export const RETENTION_SECONDS = 7 * 24 * 60 * 60;
export const MAX_BODY_BYTES = 100 * 1024;

const HOOK_ID_RE = /^[a-zA-Z0-9-]{8,64}$/;
export function isValidHookId(id: string): boolean {
  return HOOK_ID_RE.test(id);
}
