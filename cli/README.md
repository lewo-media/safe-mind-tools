# safe-mind CLI

Command-line interface for [Safe Mind](https://www.safe-mind.de), the platform for the
legally required psychological risk assessment (Gefährdungsbeurteilung psychischer
Belastung, GBU Psyche) in Germany.

Create surveys, manage departments and locations, and read threshold-protected
analytics straight from the terminal - useful for safety professionals (SiFa) who
onboard several client companies, and for automation.

## Install

```bash
npm install -g safe-mind
```

## Quick start

```bash
# one-time: create an account (or use your existing safe-mind.de account)
safe-mind register --email you@example.com --password '...' \
  --first-name Jane --last-name Doe --company "Example GmbH" --employees 220
safe-mind verify --email you@example.com --code 123456

# obtain and store an API key
safe-mind login --email you@example.com --password '...'

# set up the company structure and create a survey draft in one go
safe-mind surveys create \
  --start 2026-10-01 --weeks 4 --employees 220 \
  --department "Produktion (Halle 1, 2)" \
  --department "Verwaltung" \
  --department "Vertrieb"

# once the survey ran: aggregated, anonymity-protected results
safe-mind analytics <surveyId> --group-by department
```

Departments passed by name are created automatically if they do not exist yet.
Analytics respect the same minimum group size as the Safe Mind app (results for
groups below the threshold are never returned).

## Authentication

`safe-mind login` stores the API key in `~/.safe-mind/config.json` (mode 600).
Alternatively set `SAFE_MIND_API_KEY`. The key is scoped to your company.

## All commands

Run `safe-mind --help`.

## Related

- [Developer documentation](https://www.safe-mind.de/developers)
- [safe-mind-mcp](https://www.npmjs.com/package/safe-mind-mcp) - MCP server for AI assistants
