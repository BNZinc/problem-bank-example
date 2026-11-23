import { Mastra } from "@mastra/core";
import { problemDetector } from "./agents/problem-detector.js";

/**
 * The app's AI agents (Mastra). Add an agent in agents/ and list it here; the Nest side calls it
 * through AiService (src/ai/ai.service.ts), which turns a missing key into a friendly message.
 */
export const mastra = new Mastra({
  agents: { problemDetector },
  // Errors are reported by AiService without the request body (which may hold a user's file).
  logger: false,
});
