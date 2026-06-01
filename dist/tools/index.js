import { registerWorkspaceTools } from "./workspace.js";
import { registerPeerTools } from "./peer.js";
import { registerSessionTools } from "./session.js";
import { registerMessageTools } from "./message.js";
import { registerConclusionTools } from "./conclusion.js";
import { registerWebhookTools } from "./webhook.js";
import { registerKeyTools } from "./key.js";
import { registerQueueTools } from "./queue-tools.js";
export const registerAllTools = (server, layer, config) => {
    registerWorkspaceTools(server, layer);
    registerPeerTools(server, layer);
    registerSessionTools(server, layer);
    registerMessageTools(server, layer);
    registerConclusionTools(server, layer);
    registerWebhookTools(server, layer);
    registerKeyTools(server, layer);
    registerQueueTools(server, config);
};
