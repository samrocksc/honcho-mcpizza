# Honcho MCP

MCP server for Claude that connects to a self-hosted Honcho instance. Enables persistent memory across conversations.

## Install in Claude Code

Add to `~/.claude/settings.json` (or `settings.local.json` for project-specific config):

```json
{
  "mcpServers": {
    "honcho": {
      "command": "npx",
      "args": ["-y", "github:samrocksc/honcho-mcpizza", "--honcho-url", "http://your-honcho-server:8000"],
      "env": {
        "HONCHO_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Install in Claude Desktop

1. Edit your Claude Desktop config:
   - **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

2. Add to the config:
```json
{
  "mcpServers": {
    "honcho": {
      "command": "npx",
      "args": ["-y", "github:samrocksc/honcho-mcpizza", "--honcho-url", "http://your-honcho-server:8000"],
      "env": {
        "HONCHO_API_KEY": "your-api-key"
      }
    }
  }
}
```

3. Restart Claude Desktop.

## Run Locally

```bash
npm install
npm run build
node dist/index.js --honcho-url http://localhost:8000
```

Or directly:
```bash
npm run dev --honcho-url http://localhost:8000
```

## Configuration

Pass via CLI args or env vars (CLI takes precedence):

- `HONCHO_URL` / `--honcho-url` — Honcho server URL (required)
- `HONCHO_API_KEY` / `--honcho-api-key` — API key (optional)
- `HONCHO_STORAGE_TARGETS` / `--storage-targets` — Where to save conclusions: `peer` (cross-session), `session` (per-conversation), or `peer,session` (both, default)

## Tools

Exposes 49 Honcho tools for querying/updating memory:
- `peer_*` — user knowledge (cross-session)
- `session_*` — conversation context
- `message_*`, `conclusion_*` — storage
- `workspace_*`, `webhook_*`, `key_*` — management

See [honcho-mcp.md](./skills/honcho-mcp.md) for full API documentation.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Tool not found | Restart Claude after config change |
| Cannot connect | Check server URL and that Honcho is running |
| 401 Unauthorized | Verify `HONCHO_API_KEY` |
| Claude not remembering | Check `HONCHO_STORAGE_TARGETS` env var |
