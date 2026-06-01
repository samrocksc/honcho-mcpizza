---
name: honcho-mcp
description: Use Honcho memory tools for querying and updating a self-hosted Honcho instance from Claude Desktop
metadata:
  type: mcp
---

# Honcho MCP for Claude Desktop

Exposes all Honcho v3.0.6 operations as tools for Claude Desktop, enabling you to query and modify user memory across workspaces, peers, sessions, messages, and conclusions.

## When to Use

- **Query memory:** Use `peer_get_representation`, `peer_chat`, or `session_get_context` to read Honcho memory
- **Modify memory:** Use `conclusion_create`, `message_create`, or `peer_set_card` to update Honcho
- **Search:** Use `workspace_search`, `peer_search`, or `conclusion_query` for semantic/full-text search
- **Manage structures:** Create/update/delete workspaces, peers, sessions as needed

## Storage Targets

Choose where conclusions and messages are stored:

- `peer` — knowledge about users, cross-session (peer representations)
- `session` — knowledge about specific sessions/conversations
- `peer,session` (default) — both levels simultaneously

Configure via `HONCHO_STORAGE_TARGETS` or `--storage-targets`:

```json
{
  "env": {
    "HONCHO_STORAGE_TARGETS": "peer,session"
  }
}
```

This affects queue tool schemas: if only `session` is enabled, `session_id` becomes required; if only `peer`, it's omitted.

## Installation (Claude Desktop)

1. **Install the package:**
   ```bash
   npm install -g honcho-mcpizza
   ```

2. **Add to Claude Desktop config** (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):
   ```json
   {
     "mcpServers": {
       "honcho": {
         "command": "node",
         "args": ["/path/to/dist/index.js", "--honcho-url", "http://your-honcho-server:8000"],
         "env": {
           "HONCHO_API_KEY": "your-api-key-if-needed"
         }
       }
     }
   }
   ```

   Or via env vars only:
   ```json
   {
     "mcpServers": {
       "honcho": {
         "command": "node",
         "args": ["/path/to/dist/index.js"],
         "env": {
           "HONCHO_URL": "http://your-honcho-server:8000",
           "HONCHO_API_KEY": "your-api-key-if-needed"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop** for changes to take effect.

## Periodic Auto-Save Pattern

For hands-off memory updates, use the queue + flush approach:

1. Call `queue_conclusion` or `queue_message` to batch writes (no immediate save)
2. Periodically call `flush_conclusions` or `flush_messages` to sync to Honcho
3. Check queue status with `queue_status`

Configure Claude Desktop to remind you:
```json
{
  "systemPrompt": "Every 10 messages, call queue_status. If conclusions_queued or messages_queued > 0, call flush_conclusions and flush_messages."
}
```

This way memory accumulates locally and syncs on a schedule you control.

## Available Tools

**49 total tools** organized by resource type:

### Workspace (7 tools)
- `workspace_get_or_create`
- `workspace_list`
- `workspace_update`
- `workspace_delete`
- `workspace_search`
- `workspace_queue_status`
- `workspace_schedule_dream`

### Peer (10 tools)
- `peer_get_or_create`
- `peer_list`
- `peer_update`
- `peer_list_sessions`
- `peer_chat` — natural language query with dialectic reasoning
- `peer_get_representation` — curated summary
- `peer_get_card` — view card data
- `peer_set_card` — update card data
- `peer_get_context` — combined representation + card
- `peer_search` — search peer's messages

### Session (13 tools)
- `session_get_or_create`
- `session_list`
- `session_update`
- `session_delete`
- `session_clone`
- `session_add_peers`
- `session_set_peers`
- `session_remove_peers`
- `session_list_peers`
- `session_get_peer_config`
- `session_set_peer_config`
- `session_get_context`
- `session_get_summaries`
- `session_search`

### Message (4 tools)
- `message_create` — batch create (up to 100)
- `message_list` — paginated
- `message_get`
- `message_update` — metadata only

### Conclusion (4 tools)
- `conclusion_create` — batch create (up to 100)
- `conclusion_list` — paginated
- `conclusion_query` — semantic search
- `conclusion_delete`

### Webhook (4 tools)
- `webhook_get_or_create`
- `webhook_list`
- `webhook_delete`
- `webhook_test`

### Key & Health (2 tools)
- `key_create` — scoped API key
- `health_check` — verify server connectivity

### Queue & Flush (5 tools)
- `queue_conclusion` — batch a conclusion (not saved yet)
- `queue_message` — batch a message (not saved yet)
- `flush_conclusions` — save all queued conclusions at once
- `flush_messages` — save all queued messages at once
- `queue_status` — check how many items are pending

## Common Workflows

### Query a peer's memory
```
1. health_check  — confirm server is up
2. workspace_get_or_create  — ensure workspace exists
3. peer_get_or_create  — ensure peer exists
4. peer_get_representation  — read representation
5. peer_chat  — ask a question about the peer
```

### Add messages to a session
```
1. session_get_or_create  — create session
2. session_add_peers  — add peers to observe
3. message_create  — batch-add messages
4. session_get_context  — view updated session
```

### Save a conclusion
```
1. conclusion_create  — observer making a conclusion about observed peer
2. conclusion_query  — search by semantic similarity
```

## Workspaces

Workspaces are top-level containers for organizing peers and sessions. Think of them as project/app boundaries.

### Creating & Using Workspaces

Most tools require a `workspace_id`. Get or create one:

```
workspace_get_or_create(name="my-app") → returns { id: "ws_abc123", ... }
```

Then pass the `workspace_id` to other tools:
- `peer_get_or_create(workspace_id="ws_abc123", name="alice")`
- `session_get_or_create(workspace_id="ws_abc123", name="conversation-1")`
- `workspace_search(workspace_id="ws_abc123", query="...")`

### Multi-Workspace Setup

You can have multiple workspaces in the same Honcho server:
- `workspace_id="ws_prod"` for production data
- `workspace_id="ws_staging"` for testing
- `workspace_id="ws_personal"` for personal notes

Just use different workspace IDs in your tool calls.

### Default Workspace

If you don't explicitly create a workspace, you can ask Claude to create one or use:
```
workspace_get_or_create(name="default") → reuses if exists
```

The workspace ID persists—future calls with the same name get the same workspace.

## Configuration

### Environment Variables
- `HONCHO_URL` (required) — Base URL of self-hosted Honcho (e.g., `http://honcho.internal:8000`)
- `HONCHO_API_KEY` (optional) — Bearer token for scoped access (omit for zero-trust localhost)

### CLI Arguments
- `--honcho-url` — Override `HONCHO_URL`
- `--honcho-api-key` — Override `HONCHO_API_KEY`
- `--workspace-id` — Set default workspace (used if not specified in tool calls)

CLI args take precedence over env vars.

### Default Values (Workspace, Peer, AI Peer)

Set defaults via CLI args or env vars so you don't have to pass them every time:

**Via CLI args:**
```json
{
  "mcpServers": {
    "honcho": {
      "command": "npx",
      "args": ["-y", "github:samrocksc/honcho-mcpizza", "--honcho-url", "http://your-honcho-server:8000", "--workspace-id", "ws_my_app", "--peer-name", "alice", "--ai-peer", "claude"],
      "env": {
        "HONCHO_API_KEY": "your-api-key"
      }
    }
  }
}
```

**Via env vars:**
```json
{
  "mcpServers": {
    "honcho": {
      "command": "npx",
      "args": ["-y", "github:samrocksc/honcho-mcpizza", "--honcho-url", "http://your-honcho-server:8000"],
      "env": {
        "HONCHO_WORKSPACE_ID": "ws_my_app",
        "HONCHO_PEER_NAME": "alice",
        "HONCHO_AI_PEER": "claude",
        "HONCHO_API_KEY": "your-api-key"
      }
    }
  }
}
```

**How it works:**
- `workspace_id` defaults to `HONCHO_WORKSPACE_ID` if not specified in a tool call
- `peer_name` defaults to `HONCHO_PEER_NAME` if not specified
- `ai_peer` defaults to `HONCHO_AI_PEER` if not specified
- Pass values directly to tool calls to override defaults

## Example: Query Memory

In Claude Desktop, ask:
> Create a workspace, add a peer "alice", and tell me what you know about Alice.

Claude will:
1. Call `workspace_get_or_create` to ensure workspace exists
2. Call `peer_get_or_create` to create peer "alice"
3. Call `peer_get_representation` to read Alice's representation
4. Display the results

## Troubleshooting

**"health_check returns 404"** — Your Honcho URL is wrong or the server is down.

**"HTTP 401: Unauthorized"** — API key is invalid or missing. Check `HONCHO_API_KEY`.

**"Tool not found"** — Restart Claude Desktop after config change.

**Large response times** — Queries with high `max_conclusions` or `search_top_k` can be slow. Reduce limits.

## References

- [Honcho Docs](https://honcho.dev)
- [MCP Spec](https://modelcontextprotocol.io)
