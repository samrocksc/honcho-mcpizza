import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import type { Layer } from "effect";
import { Effect } from "effect";
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


const sessionPeerConfigSchema = z.record(
  z.object({
    observe_me: z.boolean().optional(),
    observe_others: z.boolean().optional(),
  })
);

export const registerSessionTools = (
  server: McpServer,
  layer: Layer.Layer<HonchoClientService>
): void => {
  server.registerTool(
    "session_get_or_create",
    {
      description: "Get or create a session",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        id: z.string().describe("Unique session identifier"),
        metadata: z.record(z.unknown()).optional(),
        peers: sessionPeerConfigSchema.optional(),
        configuration: z.record(z.unknown()).optional(),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "POST",
            `/workspaces/${args.workspace_id}/sessions`,
            {
              id: args.id,
              metadata: args.metadata,
              peers: args.peers,
              configuration: args.configuration,
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

  server.registerTool(
    "session_list",
    {
      description: "List all sessions in a workspace",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        page: z.number().int().positive().default(1),
        size: z.number().int().min(1).max(100).default(50),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "POST",
            `/workspaces/${args.workspace_id}/sessions/list`,
            { page: args.page, size: args.size }
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
    "session_update",
    {
      description: "Update session metadata or configuration",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        session_id: z.string().describe("Session ID"),
        metadata: z.record(z.unknown()).optional(),
        configuration: z.record(z.unknown()).optional(),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "PUT",
            `/workspaces/${args.workspace_id}/sessions/${args.session_id}`,
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
    "session_delete",
    {
      description: "Delete a session (async)",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        session_id: z.string().describe("Session ID"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          yield* client.request(
            "DELETE",
            `/workspaces/${args.workspace_id}/sessions/${args.session_id}`
          );
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
    "session_clone",
    {
      description: "Clone a session (optionally up to a message_id)",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        session_id: z.string().describe("Session ID to clone"),
        message_id: z.string().optional().describe("Cut-off message ID"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const params = new URLSearchParams();
          if (args.message_id) params.append("message_id", args.message_id);
          const query = params.toString() ? `?${params.toString()}` : "";
          const result = yield* client.request(
            "POST",
            `/workspaces/${args.workspace_id}/sessions/${args.session_id}/clone${query}`
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
    "session_add_peers",
    {
      description: "Add peers to a session",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        session_id: z.string().describe("Session ID"),
        peers: sessionPeerConfigSchema.describe("Peer configs"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "POST",
            `/workspaces/${args.workspace_id}/sessions/${args.session_id}/peers`,
            args.peers
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
    "session_set_peers",
    {
      description: "Set (replace) peers in a session",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        session_id: z.string().describe("Session ID"),
        peers: sessionPeerConfigSchema.describe("New peer configs"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "PUT",
            `/workspaces/${args.workspace_id}/sessions/${args.session_id}/peers`,
            args.peers
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
    "session_remove_peers",
    {
      description: "Remove peers from a session",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        session_id: z.string().describe("Session ID"),
        peer_ids: z.array(z.string()).describe("Peer IDs to remove"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "DELETE",
            `/workspaces/${args.workspace_id}/sessions/${args.session_id}/peers`,
            args.peer_ids
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
    "session_list_peers",
    {
      description: "List peers in a session",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        session_id: z.string().describe("Session ID"),
        page: z.number().int().positive().default(1),
        size: z.number().int().min(1).max(100).default(50),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const params = new URLSearchParams();
          params.append("page", args.page.toString());
          params.append("size", args.size.toString());
          const result = yield* client.request(
            "GET",
            `/workspaces/${args.workspace_id}/sessions/${args.session_id}/peers?${params.toString()}`
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
    "session_get_peer_config",
    {
      description: "Get peer config within a session",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        session_id: z.string().describe("Session ID"),
        peer_id: z.string().describe("Peer ID"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "GET",
            `/workspaces/${args.workspace_id}/sessions/${args.session_id}/peers/${args.peer_id}/config`
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
    "session_set_peer_config",
    {
      description: "Set peer config within a session",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        session_id: z.string().describe("Session ID"),
        peer_id: z.string().describe("Peer ID"),
        config: z.object({
          observe_me: z.boolean().optional(),
          observe_others: z.boolean().optional(),
        }),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "PUT",
            `/workspaces/${args.workspace_id}/sessions/${args.session_id}/peers/${args.peer_id}/config`,
            args.config
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
    "session_get_context",
    {
      description: "Get session context (messages + optional summary + optional peer representation)",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        session_id: z.string().describe("Session ID"),
        tokens: z.number().int().max(100000).optional().describe("Token budget"),
        summary: z.boolean().default(true).describe("Include summary if available"),
        search_query: z.string().optional().describe("Semantic search query"),
        peer_target: z.string().optional().describe("Peer ID for representation"),
        peer_perspective: z.string().optional().describe("Observer peer ID"),
        limit_to_session: z.boolean().default(false),
        search_top_k: z.number().int().min(1).max(100).optional(),
        search_max_distance: z.number().min(0).max(1).optional(),
        include_most_frequent: z.boolean().optional(),
        max_conclusions: z.number().int().min(1).max(100).optional(),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const params = new URLSearchParams();
          if (args.tokens) params.append("tokens", args.tokens.toString());
          params.append("summary", args.summary.toString());
          if (args.search_query) params.append("search_query", args.search_query);
          if (args.peer_target) params.append("peer_target", args.peer_target);
          if (args.peer_perspective) params.append("peer_perspective", args.peer_perspective);
          params.append("limit_to_session", args.limit_to_session.toString());
          if (args.search_top_k) params.append("search_top_k", args.search_top_k.toString());
          if (args.search_max_distance) params.append("search_max_distance", args.search_max_distance.toString());
          if (args.include_most_frequent !== undefined) params.append("include_most_frequent", args.include_most_frequent.toString());
          if (args.max_conclusions) params.append("max_conclusions", args.max_conclusions.toString());
          const result = yield* client.request(
            "GET",
            `/workspaces/${args.workspace_id}/sessions/${args.session_id}/context?${params.toString()}`
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
    "session_get_summaries",
    {
      description: "Get short and long summaries for a session",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        session_id: z.string().describe("Session ID"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "GET",
            `/workspaces/${args.workspace_id}/sessions/${args.session_id}/summaries`
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
    "session_search",
    {
      description: "Semantic/full-text search within a session",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        session_id: z.string().describe("Session ID"),
        query: z.string().describe("Search query"),
        limit: z.number().int().min(1).max(100).default(10),
        filters: z.record(z.unknown()).optional(),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "POST",
            `/workspaces/${args.workspace_id}/sessions/${args.session_id}/search`,
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
};
