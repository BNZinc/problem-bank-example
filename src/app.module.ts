import { type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { AiModule } from "./ai/ai.module.js";
import { DbModule } from "./db/db.module.js";
import { DetectController, DetectModule } from "./detect/detect.js";
import { HealthController } from "./health/health.controller.js";
import { ProblemsController } from "./problems/problems.controller.js";
import { ProblemsModule } from "./problems/problems.module.js";
import { WorksheetsController, WorksheetsModule } from "./worksheets/worksheets.js";
import { WorkspaceMiddleware } from "./workspace/workspace.middleware.js";
import { SpaceController, WorkspaceModule } from "./workspace/workspace.module.js";

@Module({
  imports: [DbModule, AiModule, WorkspaceModule, ProblemsModule, WorksheetsModule, DetectModule],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Whose bank: every route but the health check (Railway's probe must not make demo spaces).
    consumer.apply(WorkspaceMiddleware).forRoutes(ProblemsController, WorksheetsController, DetectController, SpaceController);
  }
}
