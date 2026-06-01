# Honcho MCP for Claude Desktop

A tool that lets Claude remember things between conversations.

## What Is This?

Normally, Claude forgets everything once a conversation ends. This tool connects Claude to **Honcho**, a memory system that stores what Claude learns about you or specific conversations.

Think of it like giving Claude a notebook to write in and read from — except the notebook persists across all your chats.

## What Can It Do?

**Store information:**
- Facts Claude learns about you (your preferences, habits, goals)
- Session notes (what happened in a specific conversation)
- Custom insights Claude discovers

**Retrieve information:**
- Claude can look back at past conversations
- Claude can recall facts about you from previous chats
- Claude can search across all your conversations at once

## Getting Started

### 1. Install

```bash
npm install -g honcho-mcpizza
```

### 2. Set Up Honcho Server

You need a Honcho server running. If you have one at `http://100.77.182.4:8000`, great. Otherwise, ask your admin for the URL.

### 3. Connect to Claude Desktop

Edit your Claude Desktop config file:

**Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add this:

```json
{
  "mcpServers": {
    "honcho": {
      "command": "node",
      "args": ["/path/to/dist/index.js", "--honcho-url", "http://YOUR-HONCHO-SERVER:8000"],
      "env": {
        "HONCHO_API_KEY": "your-api-key-if-needed"
      }
    }
  }
}
```

Replace `http://YOUR-HONCHO-SERVER:8000` with your actual Honcho server URL.

### 4. Restart Claude Desktop

Close and reopen Claude Desktop. The Honcho tools should now be available.

## How To Use It

### Save Information (The Easy Way)

Tell Claude to remember something, and it will automatically save it:

> "Remember: I prefer tea over coffee, and I'm working on a machine learning project."

Claude will queue this information and periodically save it to Honcho.

### Read Information

Claude can look up what it knows about you:

> "What do you know about my preferences?"

Claude will search Honcho and tell you what it has learned.

### Search Past Conversations

Ask Claude to find something from any previous chat:

> "Did I mention anything about my work schedule in past conversations?"

Claude will search across all your sessions and find relevant information.

## Two Modes: You vs. Conversations

By default, Honcho stores information at two levels:

**About You** (`peer` mode)
- Information about you personally
- Carries across all conversations
- Example: "I prefer remote work" (applies everywhere)

**About This Conversation** (`session` mode)
- Information specific to this conversation
- Only exists in this chat
- Example: "We discussed building an API" (just this conversation)

Claude stores things in both places, so you get cross-conversation knowledge AND session-specific context.

## Configuration

### Change Storage Mode

If you only want to store per-conversation (no cross-session memory):

```json
"env": {
  "HONCHO_STORAGE_TARGETS": "session"
}
```

Or peer-only (no per-conversation storage):

```json
"env": {
  "HONCHO_STORAGE_TARGETS": "peer"
}
```

Default is both: `"peer,session"`

### Add API Key (If Required)

If your Honcho server requires authentication:

```json
"env": {
  "HONCHO_API_KEY": "your-secret-key-here"
}
```

## How Memory Actually Works

### When You First Chat

1. Claude reads what Honcho knows about you (if anything)
2. Claude uses that info to personalize responses
3. As the conversation goes, Claude learns new things

### Auto-Save (Periodic)

Every 10 messages or so, Claude automatically saves what it learned:

```
Queue conclusion → Queue conclusion → Flush to Honcho
(accumulates)     (accumulates)      (saves all at once)
```

You don't have to do anything. It just happens.

### Manual Save

You can force a save right now:

> "Save everything you've learned about me so far."

Claude will flush all pending memories immediately.

## Troubleshooting

**"Tool not found" error**
- Restart Claude Desktop after changing the config file
- Make sure the Honcho server URL is correct

**"Cannot connect to Honcho"**
- Check your server URL in the config
- Make sure the Honcho server is actually running
- Check if you need an API key (ask your admin)

**Claude isn't remembering things**
- Make sure you've told Claude to save (or it auto-saves periodically)
- Check that storage targets are enabled (`HONCHO_STORAGE_TARGETS`)

## What Gets Saved?

Claude saves:
- Facts about you (preferences, habits, work)
- Insights from conversations
- Context from past sessions
- Anything you explicitly ask it to remember

Claude does NOT save:
- Sensitive information (unless you tell it to)
- Personal conversations (unless you ask)
- Private chat messages (unless you save them explicitly)

You're in control — Claude only saves what makes sense.

## Questions?

This tool is built to be simple. If something confuses you, that's a sign it could be clearer. Feedback welcome!
