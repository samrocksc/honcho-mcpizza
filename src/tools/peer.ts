import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import type { Layer } from "effect";
import { Effect } from "effect";
import { z } from "zod";
import { HonchoClient, type HonchoClientService } from "../client/index";
import type { HonchoClientError } from "../client/errors";

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


export const registerPeerTools = (
  server: McpServer,
  layer: Layer.Layer<HonchoClientService>
): void => {
  server.registerTool(
    "peer_get_or_create",
    {
      description: "Get or create a peer in a workspace",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        id: z.string().describe("Unique peer identifier"),
        metadata: z.record(z.unknown()).optional().describe("Optional metadata"),
        configuration: z.record(z.unknown()).optional().describe("Optional configuration"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "POST",
            `/workspaces/${args.workspace_id}/peers`,
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
    "peer_list",
    {
      description: "List all peers in a workspace",
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
            `/workspaces/${args.workspace_id}/peers/list`,
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
    "peer_update",
    {
      description: "Update peer metadata or configuration",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        peer_id: z.string().describe("Peer ID"),
        metadata: z.record(z.unknown()).optional().describe("New metadata"),
        configuration: z.record(z.unknown()).optional().describe("New configuration"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "PUT",
            `/workspaces/${args.workspace_id}/peers/${args.peer_id}`,
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
    "peer_list_sessions",
    {
      description: "List sessions for a peer",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        peer_id: z.string().describe("Peer ID"),
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
            `/workspaces/${args.workspace_id}/peers/${args.peer_id}/sessions`,
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
    "peer_chat",
    {
      description: "Query peer representation via natural language (dialectic reasoning)",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        peer_id: z.string().describe("Peer ID"),
        query: z.string().min(1).max(10000).describe("Natural language query"),
        session_id: z.string().optional().describe("Optional session ID for context"),
        target: z.string().optional().describe("Optional target peer for theory-of-mind"),
        reasoning_level: z.enum(["minimal", "low", "medium", "high", "max"]).default("low"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "POST",
            `/workspaces/${args.workspace_id}/peers/${args.peer_id}/chat`,
            {
              query: args.query,
              session_id: args.session_id,
              target: args.target,
              stream: false,
              reasoning_level: args.reasoning_level,
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
    "peer_get_representation",
    {
      description: "Get curated peer representation",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        peer_id: z.string().describe("Peer ID"),
        session_id: z.string().optional(),
        target: z.string().optional(),
        search_query: z.string().optional(),
        search_top_k: z.number().int().min(1).max(100).optional(),
        search_max_distance: z.number().min(0).max(1).optional(),
        include_most_frequent: z.boolean().optional(),
        max_conclusions: z.number().int().min(1).max(100).default(25),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "POST",
            `/workspaces/${args.workspace_id}/peers/${args.peer_id}/representation`,
            {
              session_id: args.session_id,
              target: args.target,
              search_query: args.search_query,
              search_top_k: args.search_top_k,
              search_max_distance: args.search_max_distance,
              include_most_frequent: args.include_most_frequent,
              max_conclusions: args.max_conclusions,
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
    "peer_get_card",
    {
      description: "Get peer card",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        peer_id: z.string().describe("Peer ID"),
        target: z.string().optional().describe("Observer's peer ID for perspective"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const params = new URLSearchParams();
          if (args.target) params.append("target", args.target);
          const query = params.toString() ? `?${params.toString()}` : "";
          const result = yield* client.request(
            "GET",
            `/workspaces/${args.workspace_id}/peers/${args.peer_id}/card${query}`
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
    "peer_set_card",
    {
      description: "Set (overwrite) peer card",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        peer_id: z.string().describe("Peer ID"),
        peer_card: z.array(z.string()).describe("Array of peer card items"),
        target: z.string().optional().describe("Observer's peer ID for perspective"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const params = new URLSearchParams();
          if (args.target) params.append("target", args.target);
          const query = params.toString() ? `?${params.toString()}` : "";
          const result = yield* client.request(
            "PUT",
            `/workspaces/${args.workspace_id}/peers/${args.peer_id}/card${query}`,
            { peer_card: args.peer_card }
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
    "peer_get_context",
    {
      description: "Get combined context (representation + card)",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        peer_id: z.string().describe("Peer ID"),
        target: z.string().optional(),
        search_query: z.string().optional(),
        search_top_k: z.number().int().min(1).max(100).optional(),
        search_max_distance: z.number().min(0).max(1).optional(),
        include_most_frequent: z.boolean().optional(),
        max_conclusions: z.number().int().min(1).max(100).default(25),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const params = new URLSearchParams();
          if (args.target) params.append("target", args.target);
          if (args.search_query) params.append("search_query", args.search_query);
          if (args.search_top_k) params.append("search_top_k", args.search_top_k.toString());
          if (args.search_max_distance) params.append("search_max_distance", args.search_max_distance.toString());
          if (args.include_most_frequent !== undefined) params.append("include_most_frequent", args.include_most_frequent.toString());
          params.append("max_conclusions", args.max_conclusions.toString());
          const query = params.toString() ? `?${params.toString()}` : "";
          const result = yield* client.request(
            "GET",
            `/workspaces/${args.workspace_id}/peers/${args.peer_id}/context${query}`
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
    "peer_search",
    {
      description: "Search a peer's messages",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        peer_id: z.string().describe("Peer ID"),
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
            `/workspaces/${args.workspace_id}/peers/${args.peer_id}/search`,
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
