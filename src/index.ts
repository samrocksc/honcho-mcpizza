#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { Layer } from "effect";
import { parseConfig } from "./config";
import { HonchoClientLayer, HonchoConfig } from "./client/index";
import { registerAllTools } from "./tools/index";

const main = async (): Promise<void> => {
  try {
    const config = parseConfig();

    const configLayer = Layer.succeed(HonchoConfig, config);
    const clientLayer = HonchoClientLayer.pipe(Layer.provide(configLayer));

    const server = new McpServer(
      { name: "honcho-mcp", version: "0.1.0" },
      { capabilities: { logging: {}, tools: {} } }
    );

    registerAllTools(server, clientLayer, config);

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error("[honcho-mcp] Server started on stdio");

    const handleShutdown = async (): Promise<void> => {
      console.error("[honcho-mcp] Shutting down...");
      await server.close();
      process.exit(0);
    };

    process.on("SIGINT", handleShutdown);
    process.on("SIGTERM", handleShutdown);
  } catch (error) {
    console.error(
      "[honcho-mcp FATAL]",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
};

main().catch((error) => {
  console.error("[honcho-mcp FATAL]", error);
  process.exit(1);
});
