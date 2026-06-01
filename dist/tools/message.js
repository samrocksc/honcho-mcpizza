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
export const registerMessageTools = (server, layer) => {
    server.registerTool("message_create", {
        description: "Create one or more messages (batch, up to 100)",
        inputSchema: z.object({
            workspace_id: z.string().describe("Workspace ID"),
            session_id: z.string().describe("Session ID"),
            messages: z.array(z.object({
                content: z.string().max(25000).describe("Message content"),
                peer_id: z.string().describe("Peer ID"),
                metadata: z.record(z.unknown()).optional(),
                configuration: z.record(z.unknown()).optional(),
                created_at: z.string().datetime().optional().describe("ISO 8601 datetime"),
            })).max(100).describe("Array of messages to create"),
        }),
    }, (args) => Effect.runPromise(Effect.gen(function* () {
        const client = yield* HonchoClient;
        const result = yield* client.request("POST", `/workspaces/${args.workspace_id}/sessions/${args.session_id}/messages`, { messages: args.messages });
        return renderTool(result);
    }).pipe(Effect.provide(layer), Effect.catchTag("HonchoClientError", (e) => Effect.succeed(renderError(e))))));
    server.registerTool("message_list", {
        description: "List messages in a session (paginated)",
        inputSchema: z.object({
            workspace_id: z.string().describe("Workspace ID"),
            session_id: z.string().describe("Session ID"),
            page: z.number().int().positive().default(1),
            size: z.number().int().min(1).max(100).default(50),
            reverse: z.boolean().default(false).describe("Reverse sort order"),
            filters: z.record(z.unknown()).optional(),
        }),
    }, (args) => Effect.runPromise(Effect.gen(function* () {
        const client = yield* HonchoClient;
        const result = yield* client.request("POST", `/workspaces/${args.workspace_id}/sessions/${args.session_id}/messages/list`, { page: args.page, size: args.size, reverse: args.reverse, filters: args.filters });
        return renderTool(result);
    }).pipe(Effect.provide(layer), Effect.catchTag("HonchoClientError", (e) => Effect.succeed(renderError(e))))));
    server.registerTool("message_get", {
        description: "Get a single message by ID",
        inputSchema: z.object({
            workspace_id: z.string().describe("Workspace ID"),
            session_id: z.string().describe("Session ID"),
            message_id: z.string().describe("Message ID"),
        }),
    }, (args) => Effect.runPromise(Effect.gen(function* () {
        const client = yield* HonchoClient;
        const result = yield* client.request("GET", `/workspaces/${args.workspace_id}/sessions/${args.session_id}/messages/${args.message_id}`);
        return renderTool(result);
    }).pipe(Effect.provide(layer), Effect.catchTag("HonchoClientError", (e) => Effect.succeed(renderError(e))))));
    server.registerTool("message_update", {
        description: "Update message metadata",
        inputSchema: z.object({
            workspace_id: z.string().describe("Workspace ID"),
            session_id: z.string().describe("Session ID"),
            message_id: z.string().describe("Message ID"),
            metadata: z.record(z.unknown()).describe("New metadata (overwrites existing)"),
        }),
    }, (args) => Effect.runPromise(Effect.gen(function* () {
        const client = yield* HonchoClient;
        const result = yield* client.request("PUT", `/workspaces/${args.workspace_id}/sessions/${args.session_id}/messages/${args.message_id}`, { metadata: args.metadata });
        return renderTool(result);
    }).pipe(Effect.provide(layer), Effect.catchTag("HonchoClientError", (e) => Effect.succeed(renderError(e))))));
};
