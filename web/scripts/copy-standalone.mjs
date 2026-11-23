// Next's standalone output leaves out public/ and .next/static; Railway serves from standalone.
import { cpSync, existsSync } from "node:fs";
const out = ".next/standalone";
if (existsSync("public")) cpSync("public", `${out}/public`, { recursive: true });
cpSync(".next/static", `${out}/.next/static`, { recursive: true });
