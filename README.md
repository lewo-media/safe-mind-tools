# Safe Mind Developer Tools

Official CLI and MCP server for [Safe Mind](https://www.safe-mind.de) - the platform
for the legally required psychological risk assessment (Gefährdungsbeurteilung
psychischer Belastung, GBU Psyche) in Germany.

| Package | npm | Purpose |
| --- | --- | --- |
| [`cli/`](./cli) | [safe-mind](https://www.npmjs.com/package/safe-mind) | Terminal client for the Safe Mind Public API v1 |
| [`mcp/`](./mcp) | [safe-mind-mcp](https://www.npmjs.com/package/safe-mind-mcp) | MCP server for AI assistants (Claude, ChatGPT, Gemini, Cursor, ...) |

## Quick start

```bash
npm install -g safe-mind
safe-mind login --email you@example.com --password '...'
safe-mind surveys create --start 2026-10-01 --weeks 4 --employees 220 \
  --department "Produktion" --department "Verwaltung"
```

MCP (any MCP client):

```json
{
    "mcpServers": {
        "safe-mind": {
            "command": "npx",
            "args": ["-y", "safe-mind-mcp"],
            "env": { "SAFE_MIND_API_KEY": "sm_live_..." }
        }
    }
}
```

## Documentation

- API reference and examples: https://www.safe-mind.de/developers
- Anonymity: analytics endpoints only return aggregated results; groups below the
  minimum group size are filtered server-side.

## License

MIT
