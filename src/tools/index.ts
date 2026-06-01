import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Layer } from "effect";
import type { Config } from "../config.js";
import type { HonchoClientService } from "../client/index.js";
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
  layer: Layer.Layer<HonchoClientService>,
  config: Config
): void => {
  registerWorkspaceTools(server, layer);
  registerPeerTools(server, layer);
  registerSessionTools(server, layer);
  registerMessageTools(server, layer);
  registerConclusionTools(server, layer);
  registerWebhookTools(server, layer);
  registerKeyTools(server, layer);
  registerQueueTools(server, config);
};
