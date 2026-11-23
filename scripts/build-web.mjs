// `pnpm build` builds the server (nest build) and then the screen in web/, for one Railway service.
import { execFileSync } from "node:child_process";

const run = (args) => execFileSync("pnpm", args, { cwd: "web", stdio: "inherit" });
run(["install", ...(process.env.CI ? ["--frozen-lockfile"] : [])]);
run(["run", "build"]);
