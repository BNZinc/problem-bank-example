import { Controller, Get } from "@nestjs/common";
import { DEMO_AI_OFF, demoMode } from "../workspace/workspace.js";
import { AiService } from "./ai.service.js";

@Controller("ai")
export class AiController {
  constructor(private readonly ai: AiService) {}

  /** Whether AI features are on, for the screen's "키를 넣어 주세요" notice. */
  @Get("status")
  status() {
    // The public demo keeps AI off unless it was given a daily allowance (workspace.service.ts takeAi).
    if (demoMode() && !(Number(process.env.AI_DAILY_LIMIT) > 0)) return { enabled: false, message: DEMO_AI_OFF };
    return this.ai.status();
  }
}
