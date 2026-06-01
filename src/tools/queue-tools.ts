import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Config } from "../config.js";
import { queue } from "../queue.js";

const renderTool = <T>(data: T) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

const renderError = (error: Error) => ({
  content: [{ type: "text" as const, text: `Error: ${error.message}` }],
  isError: true,
});

export const registerQueueTools = (
  server: McpServer,
  config: Config
): void => {
  const sessionRequired = config.storageTargets.includes("session") &&
    !config.storageTargets.includes("peer");

  // Initialize queue with a simple fetch-based client
  queue.setClient({
    request: async <T>(
      method: string,
      path: string,
      body?: unknown
    ): Promise<T | undefined> => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (config.honchoApiKey) {
        headers["Authorization"] = `Bearer ${config.honchoApiKey}`;
      }

      const url = `${config.honchoUrl}/v3${path}`;
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorBody}`);
      }

      if (response.status === 204) {
        return undefined;
      }

      return response.json() as Promise<T>;
    },
  }, config.storageTargets);
  const conclusionSchema = sessionRequired
    ? z.object({
        content: z.string().min(1).max(65535),
        observer_id: z.string().describe("Observer peer ID"),
        observed_id: z.string().describe("Observed peer ID"),
        session_id: z.string().describe("Session ID (required for session-only mode)"),
      })
    : z.object({
        content: z.string().min(1).max(65535),
        observer_id: z.string().describe("Observer peer ID"),
        observed_id: z.string().describe("Observed peer ID"),
        session_id: z.string().optional().describe("Session ID (optional)"),
      });

  server.registerTool(
    "queue_conclusion",
    {
      description: "Add a conclusion to the batch queue (not saved until flush_conclusions is called)",
      inputSchema: conclusionSchema,
    },
    (args) => {
      queue.addConclusion({
        content: args.content,
        observer_id: args.observer_id,
        observed_id: args.observed_id,
        session_id: args.session_id,
      });
      return Promise.resolve(
        renderTool({
          status: "queued",
          total_queued: queue.conclusionCount(),
        })
      );
    }
  );

  const messageSchema = sessionRequired
    ? z.object({
        content: z.string().max(25000),
        peer_id: z.string(),
        session_id: z.string().describe("Session ID (required for session-only mode)"),
        metadata: z.record(z.unknown()).optional(),
        created_at: z.string().datetime().optional(),
      })
    : z.object({
        content: z.string().max(25000),
        peer_id: z.string(),
        session_id: z.string().optional().describe("Session ID (optional)"),
        metadata: z.record(z.unknown()).optional(),
        created_at: z.string().datetime().optional(),
      });

  server.registerTool(
    "queue_message",
    {
      description: "Add a message to the batch queue (not saved until flush_messages is called)",
      inputSchema: messageSchema,
    },
    (args) => {
      queue.addMessage({
        content: args.content,
        peer_id: args.peer_id,
        session_id: args.session_id,
        metadata: args.metadata,
        created_at: args.created_at,
      });
      return Promise.resolve(
        renderTool({
          status: "queued",
          total_queued: queue.messageCount(),
        })
      );
    }
  );

  server.registerTool(
    "flush_conclusions",
    {
      description: "Save all queued conclusions to Honcho",
      inputSchema: z.object({
        workspace_id: z.string(),
      }),
    },
    (args) =>
      (async () => {
        try {
          const conclusions = queue.getConclusionsAndClear();
          if (conclusions.length === 0) {
            return renderTool({ status: "empty", saved: 0 });
          }

          const client = queue.getClient();
          await client.request("POST", `/workspaces/${args.workspace_id}/conclusions`, {
            conclusions: conclusions.map((c) => ({
              content: c.content,
              observer_id: c.observer_id,
              observed_id: c.observed_id,
              session_id: c.session_id,
            })),
          });

          return renderTool({
            status: "flushed",
            saved: conclusions.length,
          });
        } catch (error) {
          return renderError(
            error instanceof Error ? error : new Error(String(error))
          );
        }
      })()
  );

  server.registerTool(
    "flush_messages",
    {
      description: "Save all queued messages to Honcho",
      inputSchema: z.object({
        workspace_id: z.string(),
        session_id: z.string(),
      }),
    },
    (args) =>
      (async () => {
        try {
          const messages = queue.getMessagesAndClear();
          if (messages.length === 0) {
            return renderTool({ status: "empty", saved: 0 });
          }

          const client = queue.getClient();
          await client.request(
            "POST",
            `/workspaces/${args.workspace_id}/sessions/${args.session_id}/messages`,
            { messages: messages.map((m) => ({
              content: m.content,
              peer_id: m.peer_id,
              metadata: m.metadata,
              created_at: m.created_at,
            })) }
          );

          return renderTool({
            status: "flushed",
            saved: messages.length,
          });
        } catch (error) {
          return renderError(
            error instanceof Error ? error : new Error(String(error))
          );
        }
      })()
  );

  server.registerTool(
    "queue_status",
    {
      description: "Check how many items are queued",
      inputSchema: z.object({}),
    },
    () =>
      Promise.resolve(
        renderTool({
          conclusions_queued: queue.conclusionCount(),
          messages_queued: queue.messageCount(),
        })
      )
  );
};
