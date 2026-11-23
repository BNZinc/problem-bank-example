/** Calls the server through this screen's /api/* route. Errors carry the server's Korean message. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

// On the public demo the first answer sets this visitor's space (a cookie): other requests wait
// for it, so two calls at once do not make two spaces.
let first: Promise<unknown> | null = null;

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const gate = first;
  const run = (async () => {
    if (gate) await gate.catch(() => {});
    return call<T>(path, init);
  })();
  if (!first) first = run;
  return run;
}

async function call<T>(path: string, init: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init;
  // x-qb-client: "this app's own screen" — on the public demo only these requests get a space.
  const headers = { "x-qb-client": "1", ...(json !== undefined ? { "content-type": "application/json" } : {}), ...(rest.headers as Record<string, string> | undefined) };
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...rest,
      headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiError("서버에 닿지 못했어요. 인터넷 연결을 확인해 주세요.", 0);
  }
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg = (data as { message?: unknown } | null)?.message;
    throw new ApiError(typeof msg === "string" ? msg : `요청이 실패했어요 (${res.status})`, res.status, (data as { code?: string } | null)?.code);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 200) };
  }
}

export const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));
