import { Effect } from "effect";
import { z } from "zod";
import { HonchoClient } from "../client/index.js";
const renderTool = (data) => ({
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
});
const renderError = (error) => ({
    content: [
        {
            type: "text",
            text: `Error: ${error.message}${error.status ? ` (HTTP ${error.status})` : ""}`,
        },
    ],
    isError: true,
});
export const registerKeyTools = (server, layer) => {
    server.registerTool("key_create", {
        description: "Create a new scoped API key",
        inputSchema: z.object({
            workspace_id: z.string().optional().describe("Scope to workspace"),
            peer_id: z.string().optional().describe("Scope to peer"),
            session_id: z.string().optional().describe("Scope to session"),
            expires_at: z.string().datetime().optional().describe("Expiration datetime (ISO 8601)"),
        }),
    }, (args) => Effect.runPromise(Effect.gen(function* () {
        const client = yield* HonchoClient;
        const params = new URLSearchParams();
        if (args.workspace_id)
            params.append("workspace_id", args.workspace_id);
        if (args.peer_id)
            params.append("peer_id", args.peer_id);
        if (args.session_id)
            params.append("session_id", args.session_id);
        if (args.expires_at)
            params.append("expires_at", args.expires_at);
        const query = params.toString() ? `?${params.toString()}` : "";
        const result = yield* client.request("POST", `/keys${query}`);
        return renderTool(result);
    }).pipe(Effect.provide(layer), Effect.catchTag("HonchoClientError", (e) => Effect.succeed(renderError(e))))));
    server.registerTool("health_check", {
        description: "Health check (no auth required)",
        inputSchema: z.object({}),
    }, () => Effect.runPromise(Effect.gen(function* () {
        const client = yield* HonchoClient;
        const result = yield* client.request("GET", "/health");
        return renderTool(result ?? { status: "ok" });
    }).pipe(Effect.provide(layer), Effect.catchTag("HonchoClientError", (e) => Effect.succeed(renderError(e))))));
};
