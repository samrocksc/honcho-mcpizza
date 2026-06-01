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


export const registerConclusionTools = (
  server: McpServer,
  layer: Layer.Layer<HonchoClientService>
): void => {
  server.registerTool(
    "conclusion_create",
    {
      description: "Create one or more conclusions (batch, up to 100)",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        conclusions: z.array(
          z.object({
            content: z.string().min(1).max(65535).describe("Conclusion content"),
            observer_id: z.string().describe("Observer peer ID"),
            observed_id: z.string().describe("Observed peer ID"),
            session_id: z.string().optional().describe("Optional session ID"),
          })
        ).max(100).describe("Array of conclusions to create"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "POST",
            `/workspaces/${args.workspace_id}/conclusions`,
            { conclusions: args.conclusions }
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
    "conclusion_list",
    {
      description: "List conclusions (paginated)",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        page: z.number().int().positive().default(1),
        size: z.number().int().min(1).max(100).default(50),
        reverse: z.boolean().default(false),
        filters: z.record(z.unknown()).optional(),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "POST",
            `/workspaces/${args.workspace_id}/conclusions/list`,
            { page: args.page, size: args.size, reverse: args.reverse, filters: args.filters }
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
    "conclusion_query",
    {
      description: "Semantic search over conclusions",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        query: z.string().describe("Search query"),
        top_k: z.number().int().min(1).max(100).default(10),
        distance: z.number().min(0).max(1).optional().describe("Max cosine distance"),
        filters: z.record(z.unknown()).optional(),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "POST",
            `/workspaces/${args.workspace_id}/conclusions/query`,
            { query: args.query, top_k: args.top_k, distance: args.distance, filters: args.filters }
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
    "conclusion_delete",
    {
      description: "Delete a single conclusion",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        conclusion_id: z.string().describe("Conclusion ID"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          yield* client.request(
            "DELETE",
            `/workspaces/${args.workspace_id}/conclusions/${args.conclusion_id}`
          );
          return renderTool({ status: "deleted" });
        }).pipe(
          Effect.provide(layer),
          Effect.catchTag("HonchoClientError", (e) =>
            Effect.succeed(renderError(e))
          )
        )
      )
  );
};
