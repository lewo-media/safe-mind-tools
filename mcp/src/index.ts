#!/usr/bin/env node
/**
 * safe-mind-mcp - MCP server exposing the Safe Mind Public API v1 as tools.
 * Works with every MCP client (Claude Desktop/Code, ChatGPT, Gemini, Cursor, ...).
 *
 * Auth: set SAFE_MIND_API_KEY (obtain one via the safe_mind_get_api_key tool,
 * the `safe-mind` CLI, or https://www.safe-mind.de).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { SafeMindClient, ApiError, DEFAULT_API_URL } from './client.js';

const apiUrl = process.env.SAFE_MIND_API_URL ?? DEFAULT_API_URL;
// The key can also be provided at runtime via safe_mind_get_api_key (kept in memory only).
let apiKey = process.env.SAFE_MIND_API_KEY;

function client(): SafeMindClient {
    return new SafeMindClient({ apiUrl, apiKey });
}

type ToolResult = { content: { type: 'text'; text: string }[]; isError?: boolean };

async function run(fn: () => Promise<unknown>): Promise<ToolResult> {
    try {
        const result = await fn();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
        const message =
            error instanceof ApiError
                ? `API error ${error.status}: ${error.message}`
                : error instanceof Error
                  ? error.message
                  : String(error);
        return { content: [{ type: 'text', text: message }], isError: true };
    }
}

export function buildServer(): McpServer {
    const server = new McpServer({ name: 'safe-mind', version: '0.1.0' });

    server.registerTool(
        'safe_mind_register',
        {
            description:
                'Create a Safe Mind account with a company. Safe Mind runs the legally required psychological risk assessment (Gefährdungsbeurteilung psychischer Belastung, GBU Psyche) for German companies. A verification code is sent by email; verify with safe_mind_verify_email.',
            inputSchema: {
                email: z.string().email(),
                password: z.string().min(8),
                firstName: z.string(),
                lastName: z.string(),
                companyName: z.string(),
                employeeCount: z.number().int().positive()
            }
        },
        async (input) => run(() => client().register(input))
    );

    server.registerTool(
        'safe_mind_verify_email',
        {
            description: 'Verify a Safe Mind account with the code received by email.',
            inputSchema: { email: z.string().email(), code: z.string() }
        },
        async ({ email, code }) => run(() => client().verifyEmail(email, code))
    );

    server.registerTool(
        'safe_mind_get_api_key',
        {
            description:
                'Obtain an API key for a verified Safe Mind account (email + password). The key is kept in memory for this session; for permanent use set the SAFE_MIND_API_KEY environment variable.',
            inputSchema: { email: z.string().email(), password: z.string() }
        },
        async ({ email, password }) =>
            run(async () => {
                const result = await client().createApiKey(email, password, 'safe-mind-mcp');
                apiKey = result.apiKey;
                return { message: 'API key obtained and active for this session.', apiKey: result.apiKey };
            })
    );

    server.registerTool(
        'safe_mind_me',
        { description: 'Show the authenticated Safe Mind account and company.', inputSchema: {} },
        async () => run(() => client().me())
    );

    server.registerTool(
        'safe_mind_list_departments',
        {
            description: 'List the company departments/areas (Tätigkeitsbereiche) used for survey segmentation.',
            inputSchema: {}
        },
        async () => run(() => client().listDepartments())
    );

    server.registerTool(
        'safe_mind_create_department',
        {
            description: 'Create a company department/area (Tätigkeitsbereich), e.g. "Produktion (Halle 1, 2)".',
            inputSchema: { name: z.string().min(1) }
        },
        async ({ name }) => run(() => client().createDepartment(name))
    );

    server.registerTool(
        'safe_mind_list_locations',
        { description: 'List the company locations (Standorte).', inputSchema: {} },
        async () => run(() => client().listLocations())
    );

    server.registerTool(
        'safe_mind_create_location',
        { description: 'Create a company location (Standort).', inputSchema: { name: z.string().min(1) } },
        async ({ name }) => run(() => client().createLocation(name))
    );

    server.registerTool(
        'safe_mind_create_survey',
        {
            description:
                'Create a survey draft for the psychological risk assessment. Departments are passed by name and created automatically if missing. Returns edit and preview links; the survey is started by the account owner in the Safe Mind app.',
            inputSchema: {
                title: z.string().optional(),
                startDate: z.string().describe('YYYY-MM-DD, first day of the survey'),
                durationWeeks: z.number().int().min(1).max(12),
                employeeCount: z.number().int().positive(),
                departments: z.array(z.string()).min(1),
                locations: z.array(z.string()).optional(),
                analyticsMinThreshold: z
                    .number()
                    .int()
                    .min(5)
                    .optional()
                    .describe('Minimum group size for segmented analytics (default 7)')
            }
        },
        async (input) => run(() => client().createSurvey(input))
    );

    server.registerTool(
        'safe_mind_list_surveys',
        { description: 'List the surveys of the company with status and dates.', inputSchema: {} },
        async () => run(() => client().listSurveys())
    );

    server.registerTool(
        'safe_mind_get_survey',
        {
            description: 'Show one survey: status, timeframe, participation link.',
            inputSchema: { surveyId: z.string() }
        },
        async ({ surveyId }) => run(() => client().getSurvey(surveyId))
    );

    server.registerTool(
        'safe_mind_get_analytics',
        {
            description:
                'Aggregated survey results (overall and per category), optionally grouped. Groups below the anonymity threshold are never returned.',
            inputSchema: {
                surveyId: z.string(),
                groupBy: z.enum(['department', 'location', 'ageGroup', 'gender']).optional()
            }
        },
        async ({ surveyId, groupBy }) => run(() => client().getAnalytics(surveyId, groupBy))
    );

    return server;
}

const isDirectRun = process.argv[1]?.endsWith('index.js') || process.argv[1]?.endsWith('safe-mind-mcp');
if (isDirectRun) {
    const server = buildServer();
    const transport = new StdioServerTransport();
    server.connect(transport).catch((error) => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    });
}
