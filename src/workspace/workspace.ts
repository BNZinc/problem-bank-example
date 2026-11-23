import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

/**
 * Whose bank a request uses. On your own computer it is always "local". With DEMO_MODE=1 (the
 * public demo) every visitor gets a space of their own from a random cookie, starting with the
 * sample problems, so nobody sees or changes anyone else's — and spaces nobody used for a few days
 * are cleared.
 */
export const demoMode = () => process.env.DEMO_MODE === "1";

/** What one demo visitor may keep, and how the demo protects itself. */
export const LIMITS = {
  problems: 300,
  worksheets: 30,
  spaces: 3000,
  /** A space unused this long is cleared; its cookie lives as long and is renewed on every visit. */
  idleDays: 3,
  aiPerVisitorPerDay: 5,
  /** New spaces one address may make in an hour. */
  newPerIpPerHour: 10,
  /** When full, spaces used within this many hours are never cleared to make room. */
  protectHours: 24,
} as const;

export const DEMO_AI_OFF = "체험판에서는 AI로 문제 뽑기를 꺼 두었어요. 글을 붙여 넣고 [AI 없이 나누기]는 써 볼 수 있어요.";
export const DEMO_READONLY = "지금 체험하는 분이 많아서 새로 저장하기는 잠시 막아 두었어요. 예시 문제는 둘러볼 수 있어요.";

export const COOKIE = "qb_space";
export const SPACE_ID = /^[A-Za-z0-9_-]{22}$/;
/** The demo's read-only sample, shown to requests that have no space of their own. */
export const SAMPLE_SPACE = "demo-sample";
/**
 * Sent by this app's own screen (web/lib/api.ts). Only those requests may make a demo space, so
 * link previews and crawlers that do not run the page do not. Not a security measure: anyone can
 * send it, which is why there is also a per-address limit.
 */
export const CLIENT_HEADER = "x-qb-client";

/** `@Ws() ws: string` in a controller: this request's space. */
export const Ws = createParamDecorator((_: unknown, ctx: ExecutionContext): string => ctx.switchToHttp().getRequest<{ workspace?: string }>().workspace ?? "local");
