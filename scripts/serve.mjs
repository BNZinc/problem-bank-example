// Production start (Railway): the server (dist/) on an inside-only port, and the screen (web/) on
// PORT, which is the address people open. The screen reaches the server through API_URL.
import { spawn } from "node:child_process";
import { createServer } from "node:net";

/** A free inside-only port for the server (a fixed one could be taken on your own computer). */
const freePort = () =>
  new Promise((resolve, reject) => {
    const s = createServer().once("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(String(port)));
    });
  });

const apiPort = await freePort();
const children = [];
const start = (name, args, env) => {
  const child = spawn(process.execPath, args, { stdio: "inherit", env: { ...process.env, ...env } });
  child.on("exit", (code, signal) => {
    console.error(`[serve] ${name} stopped (${signal ?? code}); stopping the rest`);
    for (const c of children) if (c !== child && c.exitCode == null) c.kill("SIGTERM");
    process.exitCode = code ?? 1;
  });
  children.push(child);
};
start("server", ["dist/main.js"], { PORT: apiPort, HOST: "127.0.0.1" });
// WEB_HOST: 127.0.0.1 when run on someone's own computer (QuestiVibe's [예시 해 보기]); open to the network on Railway.
start("web", ["web/.next/standalone/server.js"], { PORT: process.env.PORT ?? "3000", HOSTNAME: process.env.WEB_HOST ?? "0.0.0.0", API_URL: `http://127.0.0.1:${apiPort}` });
for (const sig of ["SIGTERM", "SIGINT"]) process.on(sig, () => children.forEach((c) => c.kill(sig)));
