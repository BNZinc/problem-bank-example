import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { CLIENT_HEADER, COOKIE, DEMO_READONLY, demoMode, LIMITS, SAMPLE_SPACE, SPACE_ID } from "./workspace.js";
import { WorkspaceService } from "./workspace.service.js";

type Req = Request & { workspace?: string };

/** Puts this request's space on `req.workspace` (see workspace.ts). */
@Injectable()
export class WorkspaceMiddleware implements NestMiddleware {
  constructor(private readonly spaces: WorkspaceService) {}

  async use(req: Req, res: Response, next: NextFunction) {
    try {
      if (!demoMode()) {
        req.workspace = "local";
        return next();
      }
      const cookie = (req.headers.cookie ?? "").split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
      let id = cookie && SPACE_ID.test(cookie) && (await this.spaces.touch(cookie)) ? cookie : null;
      if (!id && req.headers[CLIENT_HEADER] === "1") id = await this.spaces.create(clientIp(req));
      if (id) {
        // Renewed on every visit, so it lasts as long as the space does.
        const secure = req.headers["x-forwarded-proto"] === "https" ? "; Secure" : "";
        res.setHeader("Set-Cookie", `${COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${LIMITS.idleDays * 86_400}${secure}`);
        req.workspace = id;
        return next();
      }
      // No space of its own: the read-only sample.
      req.workspace = SAMPLE_SPACE;
      // Reading only — except "AI 없이 나누기", which saves nothing.
      if (req.method !== "GET" && req.method !== "HEAD" && !/\/detect\/plain\/?$/.test(req.path)) {
        res.status(403).json({ code: "DEMO_READONLY", message: DEMO_READONLY });
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  }
}

/** Railway's edge sets X-Real-IP (it replaces one a visitor sends); without it, the connection's own address. */
function clientIp(req: Request): string {
  const real = req.headers["x-real-ip"];
  return (typeof real === "string" && real.trim()) || req.socket.remoteAddress || "unknown";
}
