import { Global, Inject, Module, type OnApplicationShutdown } from "@nestjs/common";
import { DB, openDatabase } from "./client.js";

const CLOSE = Symbol("DB_CLOSE");

@Global()
@Module({
  providers: [
    { provide: "DB_HANDLE", useFactory: () => openDatabase() },
    { provide: DB, useFactory: (h: Awaited<ReturnType<typeof openDatabase>>) => h.db, inject: ["DB_HANDLE"] },
    { provide: CLOSE, useFactory: (h: Awaited<ReturnType<typeof openDatabase>>) => h.close, inject: ["DB_HANDLE"] },
  ],
  exports: [DB],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(CLOSE) private readonly close: () => void) {}

  onApplicationShutdown() {
    this.close();
  }
}
