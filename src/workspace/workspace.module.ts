import { Controller, Get, Global, Module, Req } from "@nestjs/common";
import { DEMO_READONLY, demoMode, LIMITS, SAMPLE_SPACE } from "./workspace.js";
import { WorkspaceMiddleware } from "./workspace.middleware.js";
import { WorkspaceService } from "./workspace.service.js";

/** For the screen's demo banner: whether this is the public demo, and whether this visitor can save. */
@Controller("space")
export class SpaceController {
  @Get()
  space(@Req() req: { workspace?: string }) {
    if (!demoMode()) return { demo: false };
    const readonly = req.workspace === SAMPLE_SPACE;
    return { demo: true, readonly, idleDays: LIMITS.idleDays, ...(readonly ? { message: DEMO_READONLY } : {}) };
  }
}

@Global()
@Module({ controllers: [SpaceController], providers: [WorkspaceService, WorkspaceMiddleware], exports: [WorkspaceService, WorkspaceMiddleware] })
export class WorkspaceModule {}
