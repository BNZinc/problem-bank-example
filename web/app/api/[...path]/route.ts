import type { NextRequest } from "next/server";

/**
 * Every /api/* request goes on to the server (the Nest app at the project's root). The browser only
 * talks to this screen's address, so there is no CORS and no second address to deploy.
 */
export const dynamic = "force-dynamic";

const API = process.env.API_URL ?? "http://127.0.0.1:4000";
const HOP = ["host", "connection", "keep-alive", "transfer-encoding", "content-length", "upgrade", "expect"];

async function forward(req: NextRequest): Promise<Response> {
  const target = new URL(req.nextUrl.pathname + req.nextUrl.search, API);
  const headers = new Headers(req.headers);
  for (const h of HOP) headers.delete(h);
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  try {
    const res = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      // @ts-expect-error Node's fetch needs this to send a streamed body
      duplex: hasBody ? "half" : undefined,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(180_000),
    });
    const out = new Headers(res.headers);
    for (const h of [...HOP, "content-encoding"]) out.delete(h);
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: out });
  } catch {
    return Response.json({ code: "SERVER_DOWN", message: "서버(백엔드)가 아직 켜지는 중이거나 멈췄어요. 잠시 뒤 다시 해 주세요." }, { status: 502 });
  }
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
