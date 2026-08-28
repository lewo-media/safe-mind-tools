# safe-mind-mcp

MCP (Model Context Protocol) server for [Safe Mind](https://www.safe-mind.de), the
platform for the legally required psychological risk assessment (Gefährdungsbeurteilung
psychischer Belastung, GBU Psyche) in Germany.

Lets AI assistants - Claude, ChatGPT, Gemini, Cursor and every other MCP client -
set up companies, create survey drafts and read anonymity-protected results.

## Setup

Claude Desktop / Claude Code (`.mcp.json` or `claude mcp add`):

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

Get an API key with the [safe-mind CLI](https://www.npmjs.com/package/safe-mind)
(`safe-mind login`) or let the assistant onboard you via the `safe_mind_register`,
`safe_mind_verify_email` and `safe_mind_get_api_key` tools.

## Tools

| Tool                                                                      | Purpose                                     |
| ------------------------------------------------------------------------- | ------------------------------------------- |
| `safe_mind_register` / `safe_mind_verify_email` / `safe_mind_get_api_key` | Account onboarding                          |
| `safe_mind_me`                                                            | Account + company info                      |
| `safe_mind_list_departments` / `safe_mind_create_department`              | Departments (Tätigkeitsbereiche)            |
| `safe_mind_list_locations` / `safe_mind_create_location`                  | Locations (Standorte)                       |
| `safe_mind_create_survey`                                                 | Survey draft incl. auto-created departments |
| `safe_mind_list_surveys` / `safe_mind_get_survey`                         | Status, timeframe, participation link       |
| `safe_mind_get_analytics`                                                 | Aggregated results, threshold-protected     |

Segmented analytics never return groups below the minimum group size - the same
anonymity rules as in the Safe Mind app apply.

## Related

- [Developer documentation](https://www.safe-mind.de/developers)
- [safe-mind CLI](https://www.npmjs.com/package/safe-mind)
