import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config.js";
import { registerWorkspaceTools } from "./workspace.js";
import { registerPeerTools } from "./peer.js";
import { registerSessionTools } from "./session.js";
import { registerMessageTools } from "./message.js";
import { registerConclusionTools } from "./conclusion.js";
import { registerWebhookTools } from "./webhook.js";
import { registerKeyTools } from "./key.js";
import { registerQueueTools } from "./queue-tools.js";

export const registerAllTools = (
  server: McpServer,
  layer: unknown,
  config: Config
): void => {
  registerWorkspaceTools(server, layer as any);
  registerPeerTools(server, layer as any);
  registerSessionTools(server, layer as any);
  registerMessageTools(server, layer as any);
  registerConclusionTools(server, layer as any);
  registerWebhookTools(server, layer as any);
  registerKeyTools(server, layer as any);
  registerQueueTools(server, config);
};
