import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import type { Layer } from "effect";
import type { Config } from "../config";
import type { HonchoClientService } from "../client/index";
import { registerWorkspaceTools } from "./workspace";
import { registerPeerTools } from "./peer";
import { registerSessionTools } from "./session";
import { registerMessageTools } from "./message";
import { registerConclusionTools } from "./conclusion";
import { registerWebhookTools } from "./webhook";
import { registerKeyTools } from "./key";
import { registerQueueTools } from "./queue-tools";

export const registerAllTools = (
  server: McpServer,
  layer: Layer.Layer<HonchoClientService>,
  config: Config
): void => {
  registerWorkspaceTools(server, layer, config);
  registerPeerTools(server, layer, config);
  registerSessionTools(server, layer, config);
  registerMessageTools(server, layer, config);
  registerConclusionTools(server, layer, config);
  registerWebhookTools(server, layer, config);
  registerKeyTools(server, layer, config);
  registerQueueTools(server, config);
};
