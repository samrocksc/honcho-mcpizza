import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { Effect, Layer } from "effect";
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


export const registerWebhookTools = (
  server: McpServer,
  layer: Layer.Layer<HonchoClientService>
): void => {
  server.registerTool(
    "webhook_get_or_create",
    {
      description: "Get or create a webhook endpoint",
      inputSchema: z.object({
        workspace_id: z.string().describe("Workspace ID"),
        url: z.string().url().describe("Webhook endpoint URL"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "POST",
            `/workspaces/${args.workspace_id}/webhooks`,
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
        workspace_id: z.string().describe("Workspace ID"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "GET",
            `/workspaces/${args.workspace_id}/webhooks`
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
        workspace_id: z.string().describe("Workspace ID"),
        endpoint_id: z.string().describe("Webhook endpoint ID"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          yield* client.request(
            "DELETE",
            `/workspaces/${args.workspace_id}/webhooks/${args.endpoint_id}`
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
        workspace_id: z.string().describe("Workspace ID"),
      }),
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* HonchoClient;
          const result = yield* client.request(
            "GET",
            `/workspaces/${args.workspace_id}/webhooks/test`
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
