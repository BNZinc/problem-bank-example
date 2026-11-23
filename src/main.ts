import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module.js";
import { FileTooBig } from "./common/file-too-big.filter.js";
import { HideWorkspace } from "./common/hide-workspace.interceptor.js";

// The server (backend). The screen in web/ reaches it through its own /api/* route, so the
// browser only ever talks to one address. QuestiVibe gives this server a free PORT in the preview.
const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: ["error", "warn", "log"] });
app.setGlobalPrefix("api");
app.useGlobalFilters(new FileTooBig());
app.useGlobalInterceptors(new HideWorkspace());
app.useBodyParser("json", { limit: "2mb" });
app.enableShutdownHooks();
const port = Number(process.env.PORT ?? 4000);
await app.listen(port, process.env.HOST ?? "127.0.0.1");
console.log(`서버가 켜졌어요: http://127.0.0.1:${port}/api/health`);
