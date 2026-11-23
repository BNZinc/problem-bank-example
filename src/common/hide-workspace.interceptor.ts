import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from "@nestjs/common";
import { map } from "rxjs";

/** Answers never carry `workspace`: on the demo it is the visitor's cookie value (kept HttpOnly). */
@Injectable()
export class HideWorkspace implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map(strip));
  }
}

function strip(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(strip);
  if (v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype) {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) if (k !== "workspace") out[k] = strip(x);
    return out;
  }
  return v;
}
