#!/usr/bin/env node
/**
 * safe-mind CLI - manage psychological risk assessments (GBU Psyche) from the terminal.
 * Thin wrapper over the Safe Mind Public API v1 (https://www.safe-mind.de/developers).
 */

import { parseArgs, flagString, flagStrings, flagNumber } from './args.js';
import { SafeMindClient, ApiError, DEFAULT_API_URL, type SurveyCreateInput } from './client.js';
import { loadConfig, saveConfig, clearConfig } from './config.js';

const VERSION = '0.1.1';

const HELP = `safe-mind ${VERSION} - Safe Mind CLI (https://www.safe-mind.de/developers)

Usage: safe-mind <command> [options]

Account
  register        --email --password --first-name --last-name --company --employees
  verify          --email --code
  login           --email --password [--name <key label>]   obtains + stores an API key
  logout                                                    removes the stored API key
  me                                                        show account and company

Surveys
  surveys create  --start YYYY-MM-DD --weeks <n> --employees <n>
                  --department "Name" [--department "Name" ...]
                  [--location "Name" ...] [--title "..."] [--threshold <5..>]
  surveys list
  surveys status  <surveyId>
  analytics       <surveyId> [--group-by department|location|ageGroup|gender]

Company setup
  departments list | departments create <name>
  locations list   | locations create <name>

Global options
  --api-url <url>   API base URL (default: ${DEFAULT_API_URL})
  --json            raw JSON output
  --help, --version

Authentication: stored via \`safe-mind login\` in ~/.safe-mind/config.json,
or set the SAFE_MIND_API_KEY environment variable.`;

function output(data: unknown, json: boolean): void {
    if (json || typeof data !== 'object' || data === null) {
        console.log(JSON.stringify(data, null, 2));
        return;
    }
    console.log(JSON.stringify(data, null, 2));
}

function requireFlag(value: string | undefined, name: string): string {
    if (!value) {
        console.error(`Missing required option --${name}`);
        process.exit(2);
    }
    return value;
}

export async function main(argv: string[]): Promise<void> {
    const { positionals, flags } = parseArgs(argv);
    const json = flags.json === true;

    if (flags.version === true) {
        console.log(VERSION);
        return;
    }
    if (positionals.length === 0 || flags.help === true) {
        console.log(HELP);
        return;
    }

    const config = loadConfig();
    const apiUrl = flagString(flags, 'api-url') ?? process.env.SAFE_MIND_API_URL ?? config.apiUrl ?? DEFAULT_API_URL;
    const apiKey = process.env.SAFE_MIND_API_KEY ?? config.apiKey;
    const client = new SafeMindClient({ apiUrl, apiKey });

    const [command, subcommand, ...rest] = positionals;

    try {
        switch (command) {
            case 'register': {
                const result = await client.register({
                    email: requireFlag(flagString(flags, 'email'), 'email'),
                    password: requireFlag(flagString(flags, 'password'), 'password'),
                    firstName: requireFlag(flagString(flags, 'first-name'), 'first-name'),
                    lastName: requireFlag(flagString(flags, 'last-name'), 'last-name'),
                    companyName: requireFlag(flagString(flags, 'company'), 'company'),
                    employeeCount: flagNumber(flags, 'employees') ?? 0
                });
                output(result, json);
                console.error(
                    '\nCheck your inbox for the verification code, then run: safe-mind verify --email ... --code ...'
                );
                break;
            }
            case 'verify': {
                const result = await client.verifyEmail(
                    requireFlag(flagString(flags, 'email'), 'email'),
                    requireFlag(flagString(flags, 'code'), 'code')
                );
                output(result, json);
                break;
            }
            case 'login': {
                const { apiKey: newKey } = await client.createApiKey(
                    requireFlag(flagString(flags, 'email'), 'email'),
                    requireFlag(flagString(flags, 'password'), 'password'),
                    flagString(flags, 'name') ?? 'safe-mind-cli'
                );
                saveConfig({ apiKey: newKey, apiUrl: apiUrl === DEFAULT_API_URL ? undefined : apiUrl });
                console.error('API key stored in ~/.safe-mind/config.json');
                break;
            }
            case 'logout': {
                clearConfig();
                console.error('Logged out.');
                break;
            }
            case 'me': {
                output(await client.me(), json);
                break;
            }
            case 'departments': {
                if (subcommand === 'create') {
                    const name = rest.join(' ') || requireFlag(flagString(flags, 'name'), 'name');
                    output(await client.createDepartment(name), json);
                } else {
                    output(await client.listDepartments(), json);
                }
                break;
            }
            case 'locations': {
                if (subcommand === 'create') {
                    const name = rest.join(' ') || requireFlag(flagString(flags, 'name'), 'name');
                    output(await client.createLocation(name), json);
                } else {
                    output(await client.listLocations(), json);
                }
                break;
            }
            case 'surveys': {
                if (subcommand === 'create') {
                    const input: SurveyCreateInput = {
                        title: flagString(flags, 'title'),
                        startDate: requireFlag(flagString(flags, 'start'), 'start'),
                        durationWeeks: flagNumber(flags, 'weeks') ?? 4,
                        employeeCount: flagNumber(flags, 'employees') ?? 0,
                        departments: flagStrings(flags, 'department'),
                        locations: flagStrings(flags, 'location'),
                        analyticsMinThreshold: flagNumber(flags, 'threshold')
                    };
                    output(await client.createSurvey(input), json);
                } else if (subcommand === 'status') {
                    output(await client.getSurvey(rest[0] ?? requireFlag(undefined, 'surveyId')), json);
                } else {
                    output(await client.listSurveys(), json);
                }
                break;
            }
            case 'analytics': {
                const surveyId = subcommand ?? requireFlag(undefined, 'surveyId');
                output(await client.getAnalytics(surveyId, flagString(flags, 'group-by')), json);
                break;
            }
            default:
                console.error(`Unknown command: ${command}\n`);
                console.log(HELP);
                process.exit(2);
        }
    } catch (error) {
        if (error instanceof ApiError) {
            console.error(`Error ${error.status}: ${error.message}`);
            process.exit(1);
        }
        throw error;
    }
}

const isDirectRun = process.argv[1]?.endsWith('index.js') || process.argv[1]?.endsWith('safe-mind');
if (isDirectRun) {
    main(process.argv.slice(2)).catch((error) => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    });
}
