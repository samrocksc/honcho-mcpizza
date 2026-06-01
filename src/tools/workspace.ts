import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Effect, Layer } from "effect";
import { z } from "zod";
import { HonchoClient, type HonchoClientService } from "../client/index.js";
import type { HonchoClientError } from "../client/errors.js";

const renderTool = <T>(data: T) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

const renderError = (error: HonchoClientError) => ({
  content: [
    {
      type: "text" as const,
      text: `Error: ${error.message}${error.status ? ` (HTTP ${error.status})` : ""}`,
    },
  ],
  isError: true,
});


export const registerWorkspaceTools = (
  server: McpServer,
  layer: Layer.Layer<HonchoClientService>
): void => {
  server.registerTool(
    "workspace_get_or_create",
    {
      description: "Get or create a workspace",
      inputSchema: z.object({
        id: z.string().describe("Unique workspace identifier (alphanum/dash/underscore, max 100)"),
        metadata: z.record(z.unknown()).optional().describe("Optional metadata object"),
        configuration: z.object({
          reasoning: z.object({
            enabled: z.boolean().optional(),
            custom_instructions: z.string().optional(),
          }).optional(),
          peer_card: z.object({
            use: z.boolean().optional(),
            create: z.boolean().optional(),
          }).optional(),
          summary: z.object({
            enabled: z.boolean().optional(),
            messages_per_short_summary: z.number().optional(),
            messages_per_long_summary: z.number().optional(),
          }).optional(),
          dream: z.object({
            enabled: z.boolean().optional(),
          }).optional(),
        }).optional().describe("Optional workspace configuration"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "POST",
            "/workspaces",
            { id: args.id, metadata: args.metadata, configuration: args.configuration }
          );
          return renderTool(result);
        }).pipe(
          Effect.provide(layer),
          Effect.catchTag("HonchoClientError", (e) =>
            Effect.succeed(renderError(e))
          )
        )
      )
  );

  server.registerTool(
    "workspace_list",
    {
      description: "List all workspaces (paginated)",
      inputSchema: z.object({
        page: z.number().int().positive().default(1).describe("Page number (1-indexed)"),
        size: z.number().int().min(1).max(100).default(50).describe("Items per page"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request("POST", "/workspaces/list", {
            page: args.page,
            size: args.size,
          });
          return renderTool(result);
        }).pipe(
          Effect.provide(layer),
          Effect.catchTag("HonchoClientError", (e) =>
            Effect.succeed(renderError(e))
          )
        )
      )
  );

  server.registerTool(
    "workspace_update",
    {
      description: "Update workspace metadata or configuration",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        metadata: z.record(z.unknown()).optional().describe("New metadata (overwrites existing)"),
        configuration: z.object({
          reasoning: z.object({
            enabled: z.boolean().optional(),
            custom_instructions: z.string().optional(),
          }).optional(),
          peer_card: z.object({
            use: z.boolean().optional(),
            create: z.boolean().optional(),
          }).optional(),
          summary: z.object({
            enabled: z.boolean().optional(),
            messages_per_short_summary: z.number().optional(),
            messages_per_long_summary: z.number().optional(),
          }).optional(),
          dream: z.object({
            enabled: z.boolean().optional(),
          }).optional(),
        }).optional().describe("New configuration (overwrites existing)"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "PUT",
            `/workspaces/${args.workspace_id}`,
            { metadata: args.metadata, configuration: args.configuration }
          );
          return renderTool(result);
        }).pipe(
          Effect.provide(layer),
          Effect.catchTag("HonchoClientError", (e) =>
            Effect.succeed(renderError(e))
          )
        )
      )
  );

  server.registerTool(
    "workspace_delete",
    {
      description: "Delete a workspace (async, returns 202 Accepted)",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          yield* client.request("DELETE", `/workspaces/${args.workspace_id}`);
          return renderTool({ status: "accepted" });
        }).pipe(
          Effect.provide(layer),
          Effect.catchTag("HonchoClientError", (e) =>
            Effect.succeed(renderError(e))
          )
        )
      )
  );

  server.registerTool(
    "workspace_search",
    {
      description: "Full-text and semantic search across workspace messages",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        query: z.string().describe("Search query"),
        limit: z.number().int().min(1).max(100).default(10).describe("Max results"),
        filters: z.record(z.unknown()).optional().describe("Optional search filters"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "POST",
            `/workspaces/${args.workspace_id}/search`,
            { query: args.query, limit: args.limit, filters: args.filters }
          );
          return renderTool(result);
        }).pipe(
          Effect.provide(layer),
          Effect.catchTag("HonchoClientError", (e) =>
            Effect.succeed(renderError(e))
          )
        )
      )
  );

  server.registerTool(
    "workspace_queue_status",
    {
      description: "Get background processing queue status",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        observer_id: z.string().optional().describe("Filter by observer ID"),
        sender_id: z.string().optional().describe("Filter by sender ID"),
        session_id: z.string().optional().describe("Filter by session ID"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const params = new URLSearchParams();
          if (args.observer_id) params.append("observer_id", args.observer_id);
          if (args.sender_id) params.append("sender_id", args.sender_id);
          if (args.session_id) params.append("session_id", args.session_id);
          const query = params.toString() ? `?${params.toString()}` : "";
          const result = yield* client.request(
            "GET",
            `/workspaces/${args.workspace_id}/queue/status${query}`
          );
          return renderTool(result);
        }).pipe(
          Effect.provide(layer),
          Effect.catchTag("HonchoClientError", (e) =>
            Effect.succeed(renderError(e))
          )
        )
      )
  );

  server.registerTool(
    "workspace_schedule_dream",
    {
      description: "Manually trigger a workspace dream (representation synthesis)",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        observer: z.string().describe("Observer peer ID"),
        observed: z.string().optional().describe("Observed peer ID (optional)"),
        session_id: z.string().optional().describe("Session ID (optional)"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "POST",
            `/workspaces/${args.workspace_id}/schedule_dream`,
            {
              observer: args.observer,
              observed: args.observed,
              dream_type: "omni",
              session_id: args.session_id,
            }
          );
          return renderTool(result);
        }).pipe(
          Effect.provide(layer),
          Effect.catchTag("HonchoClientError", (e) =>
            Effect.succeed(renderError(e))
          )
        )
      )
  );
};
