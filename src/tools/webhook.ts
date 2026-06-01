import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import type { Layer } from "effect";
import { Effect } from "effect";
import { z } from "zod";
import { HonchoClient, type HonchoClientService } from "../client/index";
import type { HonchoClientError } from "../client/errors";
import type { Config } from "../config";

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


export const registerWebhookTools = (
  server: McpServer,
  layer: Layer.Layer<HonchoClientService>,
  config: Config
): void => {
  server.registerTool(
    "webhook_get_or_create",
    {
      description: "Get or create a webhook endpoint",
      inputSchema: z.object({
        workspace_id: z.string().optional().describe("Workspace ID (uses HONCHO_WORKSPACE_ID if omitted)"),
        url: z.string().url().describe("Webhook endpoint URL"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const workspaceId = args.workspace_id ?? config.workspaceId;
          if (!workspaceId) {
            throw new Error("workspace_id is required (provide as argument or set HONCHO_WORKSPACE_ID env var)");
          }
          const result = yield* client.request(
            "POST",
            `/workspaces/${workspaceId}/webhooks`,
            { url: args.url }
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
    "webhook_list",
    {
      description: "List webhook endpoints for a workspace",
      inputSchema: z.object({
        workspace_id: z.string().optional().describe("Workspace ID (uses HONCHO_WORKSPACE_ID if omitted)"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const workspaceId = args.workspace_id ?? config.workspaceId;
          if (!workspaceId) {
            throw new Error("workspace_id is required (provide as argument or set HONCHO_WORKSPACE_ID env var)");
          }
          const result = yield* client.request(
            "GET",
            `/workspaces/${workspaceId}/webhooks`
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
    "webhook_delete",
    {
      description: "Delete a webhook endpoint",
      inputSchema: z.object({
        workspace_id: z.string().optional().describe("Workspace ID (uses HONCHO_WORKSPACE_ID if omitted)"),
        endpoint_id: z.string().describe("Webhook endpoint ID"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const workspaceId = args.workspace_id ?? config.workspaceId;
          if (!workspaceId) {
            throw new Error("workspace_id is required (provide as argument or set HONCHO_WORKSPACE_ID env var)");
          }
          yield* client.request(
            "DELETE",
            `/workspaces/${workspaceId}/webhooks/${args.endpoint_id}`
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

  server.registerTool(
    "webhook_test",
    {
      description: "Test-fire a webhook event",
      inputSchema: z.object({
        workspace_id: z.string().optional().describe("Workspace ID (uses HONCHO_WORKSPACE_ID if omitted)"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const workspaceId = args.workspace_id ?? config.workspaceId;
          if (!workspaceId) {
            throw new Error("workspace_id is required (provide as argument or set HONCHO_WORKSPACE_ID env var)");
          }
          const result = yield* client.request(
            "GET",
            `/workspaces/${workspaceId}/webhooks/test`
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
